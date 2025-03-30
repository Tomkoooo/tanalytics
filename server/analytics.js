const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());

// Token séma és modell
const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  pages: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});
const Token = mongoose.model("Token", tokenSchema, "tokens");

// Modell gyorsítótár
const modelCache = {};

const getEventModel = (token, page) => {
  const collectionName = `events_${token}_${page}`;
  if (modelCache[collectionName]) {
    return modelCache[collectionName];
  }

  const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    timestamp: { type: Date, required: true },
    parameters: { type: Object, default: {} },
    sessionId: { type: String, required: true },
  });

  modelCache[collectionName] = mongoose.model(`Event_${token}_${page}`, eventSchema, collectionName);
  return modelCache[collectionName];
};

// MongoDB kapcsolat
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("MongoDB connected to 'analytics' database");
  const tokenCount = await Token.countDocuments();
  if (tokenCount === 0) {
    const testToken = new Token({
      token: "test-token-1",
      owner: "test@example.com",
      pages: ["clearsmile", "regiadental"],
    });
    await testToken.save();
    console.log("Test token created: test-token-1 (owner: test@example.com, pages: clearsmile, regiadental)");
  }
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Token ellenőrzés page nélkül (pl. /pages végponthoz)
const authenticateTokenWithoutPage = async (req, res, next) => {
  const token = req.headers["x-api-token"];

  if (!token) {
    console.error("No API token provided");
    return res.status(401).json({ error: "API token required" });
  }

  try {
    const validToken = await Token.findOne({ token });
    if (!validToken) {
      console.error(`Invalid API token: ${token}`);
      return res.status(403).json({ error: "Invalid API token" });
    }
    req.token = token;
    next();
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Error validating token" });
  }
};

// Token ellenőrzés page paraméterrel (pl. /:page útvonalakhoz)
const authenticateToken = async (req, res, next) => {
  const token = req.headers["x-api-token"];
  const { page } = req.params;

  console.log(`Received token: ${token}, Requested page: ${page}`);

  if (!token) {
    console.error("No API token provided");
    return res.status(401).json({ error: "API token required" });
  }

  if (!page) {
    console.error("No page specified in request");
    return res.status(400).json({ error: "Page parameter is required" });
  }

  try {
    const validToken = await Token.findOne({ token });
    if (!validToken) {
      console.error(`Invalid API token: ${token}`);
      return res.status(403).json({ error: "Invalid API token" });
    }

    console.log(`Token pages: ${validToken.pages}`);
    if (!validToken.pages.includes(page)) {
      console.error(`Token ${token} does not have access to page: ${page}`);
      return res.status(403).json({ error: "Token does not have access to this page" });
    }

    req.token = token;
    next();
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Error validating token" });
  }
};

// /pages végpont
app.get("/pages", authenticateTokenWithoutPage, async (req, res) => {
  try {
    const token = req.token;
    const validToken = await Token.findOne({ token });
    res.json(validToken.pages);
  } catch (error) {
    console.error(`Error fetching pages for token ${req.token}:`, error);
    res.status(500).json({ error: "Error fetching pages" });
  }
});

// Oldal-specifikus útvonalak
app.use("/:page", authenticateToken, async (req, res, next) => {
  const { page } = req.params;
  const { token } = req;
  req.Event = getEventModel(token, page);
  await loadTemplateData(token, page);
  next();
});

// /:page/track végpont
app.post("/:page/track", async (req, res) => {
  const { eventName, parameters } = req.body;
  const cookiesAccepted = req.cookies.cookiesAccepted === "true";
  let sessionId = req.cookies.sessionId;

  if (!cookiesAccepted) {
    return res.status(403).json({ error: "Cookies are not accepted, tracking disabled" });
  }

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  }

  try {
    const event = new req.Event({
      eventName,
      timestamp: new Date(),
      parameters,
      sessionId,
    });
    await event.save();
    res.status(201).json({ message: "Event recorded", sessionId });
  } catch (error) {
    console.error(`Track error for ${req.params.page} (token: ${req.token}):`, error);
    res.status(500).json({ error: "Error during tracking", details: error.message });
  }
});

// /:page/events végpont
app.get("/:page/events", async (req, res) => {
  const { eventName, startDate, endDate, sessionId, limit = 100 } = req.query;

  try {
    const query = {};
    if (eventName) query.eventName = eventName;
    if (sessionId) query.sessionId = sessionId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await req.Event.find(query).limit(parseInt(limit)).sort({ timestamp: -1 });
    res.json(events);
  } catch (error) {
    console.error(`Events fetch error for ${req.params.page} (token: ${req.token}):`, error);
    res.status(500).json({ error: "Error fetching events", details: error.message });
  }
});

// /:page/stats végpont
app.get("/:page/stats", async (req, res) => {
  const { eventName, startDate, endDate, sessionId } = req.query;

  try {
    const match = {};
    if (eventName) match.eventName = eventName;
    if (sessionId) match.sessionId = sessionId;
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const stats = await req.Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: { eventName: "$eventName", sessionId: "$sessionId" },
          count: { $sum: 1 },
          latest: { $max: "$timestamp" },
          userId: { $first: "$parameters.userId" },
        },
      },
      {
        $group: {
          _id: "$_id.eventName",
          uniqueUsers: { $sum: 1 },
          totalCount: { $sum: "$count" },
          latest: { $max: "$latest" },
          identifiedUsers: { $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] } },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    res.json(stats);
  } catch (error) {
    console.error(`Stats fetch error for ${req.params.page} (token: ${req.token}):`, error);
    res.status(500).json({ error: "Error fetching stats", details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Analytics server running on port ${PORT}`);
});

// Template adatok betöltése
async function loadTemplateData(token, page) {
  const templateDataPath = path.join(__dirname, `./test-data-${page}.json`);
  const Event = getEventModel(token, page);
  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    try {
      const templateData = JSON.parse(await fs.readFile(templateDataPath, "utf-8"));
      await Event.insertMany(templateData);
      console.log(`Template data loaded for ${page} (token: ${token})`);
    } catch (error) {
      console.error(`Error loading template data for ${page} (token: ${token}):`, error);
    }
  } else {
    console.log(`Collection ${page} (token: ${token}) already contains data`);
  }
}