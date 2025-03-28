const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  timestamp: { type: Date, required: true },
  parameters: { 
    type: Object, 
    default: {}, 
    validate: {
      validator: function(v) {
        if (v.userId) return typeof v.userId === "string";
        return true;
      },
      message: "A userId-nak stringnek kell lennie, ha meg van adva!"
    }
  },
  sessionId: { type: String, required: true },
});

module.exports = mongoose.model("Event", eventSchema);