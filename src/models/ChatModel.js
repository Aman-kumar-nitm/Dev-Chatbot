const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      default: "New Chat"
    },

    lastMessage: String,
    lastMessageAt: Date

  },
  { timestamps: true }
);
chatSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("Chat", chatSchema);

