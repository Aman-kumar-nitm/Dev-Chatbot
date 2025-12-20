const Chat = require('../models/ChatModel.js');
const Message = require('../models/MessageModel.js');
const callLlama = require('../utils/llama.js');

const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({ userId: req.user._id });
    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    if (!message || message.length > 500) {
      return res.status(400).json({ error: "Max 500 characters" });
    }

    const msgCount = await Message.countDocuments({ chatId });

    // if (req.user.role === "user" && msgCount >= 10) {
    //   return res.status(403).json({ error: "Message limit reached" });
    // }
    if (req.user.tokenBalance < 100 && req.user.role === 'user') {
      return res.status(403).json({ error: "Insufficient tokens" });
    }
    if (msgCount == 0) {
  const titlePrompt = [
    {
      role: "system",
      content: "Generate a short, clear chat title (max 6 words). No quotes."
    },
    {
      role: "user",
      content: message
    }
  ];

  const titleResponse = await callLlama(titlePrompt);

  const aiTitle =
    titleResponse.choices?.[0]?.message?.content?.trim() ||
    message.slice(0, 30);

  await Chat.findByIdAndUpdate(chatId, {
    title: aiTitle
  });
}


    await Message.create({
      chatId,
      sender: "USER",
      content: message
    });

    const history = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(10);

    const prompt = history.reverse().map(m => ({
      role: m.sender === "USER" ? "user" : "assistant",
      content: m.content
    }));

    

    const aiResponse = await callLlama(prompt);
    const aiText = aiResponse.choices[0].message.content;

    req.user.tokenBalance -= 100;

    await Message.create({
      chatId,
      sender: "AI",
      content: aiText,
      tokenUsage: aiResponse.usage.total_tokens,
      currToken:req.user.tokenBalance
    });

    await req.user.save();

    await Chat.findByIdAndUpdate(chatId, {
      updatedAt: new Date()
    });

    res.json({ reply: aiText,currToken:req.user.tokenBalance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getChats = async (req, res) => {
  try {
    let chats;

    if (req.user.role === "Dev-Pro") {
      chats = await Chat.find().sort({ updatedAt: -1 });
    } else {
      chats = await Chat.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(5);
    }

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch allCharts",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const limit = req.user.role === "user" ? 10 : 1000;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json(messages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Only owner can delete
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Delete all messages of this chat
    await Message.deleteMany({ chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });

  } catch (error) {
    console.error("deleteChat error:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};

module.exports = { createChat, sendMessage, getChats, getMessages ,deleteChat};


// two update needed token update for each ai response and for dev-pro instead of 1000 bulky message ones cursor based scrolling