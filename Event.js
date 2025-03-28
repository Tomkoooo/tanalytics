const mongoose = require("mongoose");

// Esemény séma definiálása
const eventSchema = new mongoose.Schema({
  eventName: { 
    type: String, 
    required: true // Kötelező mező, az esemény neve (pl. "page_view", "button_click")
  },
  timestamp: { 
    type: Date, 
    required: true // Kötelező mező, az esemény időpontja
  },
  parameters: { 
    type: Object, 
    default: {} // Opcionális mező, az eseményhez kapcsolódó további adatok (pl. {"page": "/home"})
  },
});

// Modell létrehozása és exportálása
module.exports = mongoose.model("Event", eventSchema);