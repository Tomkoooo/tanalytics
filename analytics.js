const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Event = require("./Event");
const fs = require("fs").promises;
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
  try {
    const event = new Event({
      eventName,
      timestamp: new Date(),
      parameters,
    });
    await event.save();
    res.status(201).json({ message: "Esemény rögzítve" });
  } catch (error) {
    console.error("Track hiba:", error);
    res.status(500).json({ error: "Hiba történt a track közben", details: error.message });
  }
});

app.get("/events", async (req, res) => {
  const { eventName, startDate, endDate, limit = 100 } = req.query;

  try {
    const query = {};
    if (eventName) query.eventName = eventName;
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
  const { eventName, startDate, endDate } = req.query;

  try {
    const match = {};
    if (eventName) match.eventName = eventName;
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const stats = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$eventName",
          count: { $sum: 1 },
          latest: { $max: "$timestamp" },
        },
      },
      { $sort: { count: -1 } },
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