const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index:true
    },

    sender: {
      type: String,
      enum: ["USER", "AI"],
      required: true
    },

    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "FILE", "CODE"],
      default: "TEXT"
    },

    fileUrl: String,
    fileName: String,
    mimeType: String,

    content: {
      type: String,
      required: function () {
    return this.type === "TEXT" || this.type === "CODE";
  }
    },

    tokenUsage: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);
messageSchema.index({ chatId: 1, createdAt: 1 });
module.exports = mongoose.model("Message", messageSchema);

