const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Event = require("./Event");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());

const templateDataPath = path.join(__dirname, "./test-data.json");

console.log("MONGODB_URI:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("MongoDB kapcsolódva az analytics útvonalon keresztül");

  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    try {
      const templateData = JSON.parse(await fs.readFile(templateDataPath, "utf-8"));
      await Event.insertMany(templateData);
      console.log("Template adatok sikeresen importálva az adatbázisba");
    } catch (error) {
      console.error("Hiba a template adatok importálása közben:", error);
    }
  } else {
    console.log("Az adatbázis már tartalmaz adatokat, nem importálunk template adatokat");
  }
}).catch((err) => {
  console.error("MongoDB kapcsolat hiba:", err);
});

app.post("/track", async (req, res) => {
  const { eventName, parameters } = req.body;
  const cookiesAccepted = req.cookies.cookiesAccepted === "true";
  let sessionId = req.cookies.sessionId;

  if (!cookiesAccepted) {
    return res.status(403).json({ error: "Cookie-k nincsenek elfogadva, követés nem engedélyezett" });
  }

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
  }

  try {
    const event = new Event({
      eventName,
      timestamp: new Date(),
      parameters,
      sessionId,
    });
    await event.save();
    res.status(201).json({ message: "Esemény rögzítve", sessionId });
  } catch (error) {
    console.error("Track hiba:", error);
    res.status(500).json({ error: "Hiba történt a track közben", details: error.message });
  }
});

app.get("/events", async (req, res) => {
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

    const events = await Event.find(query).limit(parseInt(limit)).sort({ timestamp: -1 });
    res.json(events);
  } catch (error) {
    console.error("Events lekérdezési hiba:", error);
    res.status(500).json({ error: "Hiba történt az események lekérdezése közben", details: error.message });
  }
});

app.get("/stats", async (req, res) => {
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

    const stats = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: { eventName: "$eventName", sessionId: "$sessionId" },
          count: { $sum: 1 },
          latest: { $max: "$timestamp" },
          userId: { $first: "$parameters.userId" }, // userId kinyerése
        },
      },
      {
        $group: {
          _id: "$_id.eventName",
          uniqueUsers: { $sum: 1 },
          totalCount: { $sum: "$count" },
          latest: { $max: "$latest" },
          identifiedUsers: { $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] } }, // userId-val rendelkező sessionök
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Stats lekérdezési hiba:", error);
    res.status(500).json({ error: "Hiba történt a statisztikák lekérdezése közben", details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Analytics szerver fut a ${PORT}-es porton`);
});