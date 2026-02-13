// controllers/paymentWebhook.js
const crypto = require("crypto");
const User = require("../models/user");

const verifyPayment = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // 1️⃣ Verify signature using RAW body
  const shasum = crypto
    .createHmac("sha256", secret)
    .update(req.body) // ✅ RAW buffer
    .digest("hex");

  if (shasum !== signature) {
    console.log("❌ Invalid Razorpay signature");
    return res.status(400).send("Invalid signature");
  }

  // 2️⃣ Parse body AFTER verification
  const event = JSON.parse(req.body.toString());

  console.log("✅ Webhook event received:", event.event);

  // 3️⃣ Handle payment success
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    if (!payment.notes || !payment.notes.userId) {
      console.log("❌ userId missing in payment notes");
      return res.json({ status: "ignored" });
    }

    const userId = payment.notes.userId;

    await User.findByIdAndUpdate(userId, {
      role: "Dev-Pro",
    });

    console.log("🎉 User upgraded to Dev-Pro:", userId);
  }

  res.json({ status: "ok" });
};

module.exports = verifyPayment;
