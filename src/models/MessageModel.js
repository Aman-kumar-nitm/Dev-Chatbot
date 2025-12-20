const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true
    },

    sender: {
      type: String,
      enum: ["USER", "AI"],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    tokenUsage: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
