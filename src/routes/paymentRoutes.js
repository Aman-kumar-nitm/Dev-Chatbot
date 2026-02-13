const express=require("express")
const authMiddleware =require( "../middlewares/authMiddleware.js");

const paymentRouter = express.Router();
const createOrder=require("../controllers/paymentController.js");
const verifyPayment = require("../controllers/paymentWebhook.js");
paymentRouter.post("/create-order", authMiddleware(), createOrder);
paymentRouter.post("/webhook",verifyPayment)
module.exports=paymentRouter;
