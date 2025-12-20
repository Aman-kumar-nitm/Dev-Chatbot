const express=require("express")
const authMiddleware =require( "../middlewares/authMiddleware.js");
const { createChat, sendMessage, getChats, getMessages, deleteChat } =require( "../controllers/chatController.js");

const chatRouter = express.Router();

chatRouter.post("/create", authMiddleware(), createChat);
chatRouter.post("/message", authMiddleware(), sendMessage);
chatRouter.get("/getChats",authMiddleware(),getChats);
chatRouter.get("/getMessages/:chatId",authMiddleware(),getMessages);
chatRouter.delete("/deleteChat/:chatId",authMiddleware(),deleteChat);
module.exports=chatRouter;
