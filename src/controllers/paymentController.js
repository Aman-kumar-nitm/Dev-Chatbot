// controllers/paymentController.js
const razorpay = require("../utils/razorpay");

const createOrder = async (req, res) => {
  try {
    const options = {
      amount: 100 * 100, // ₹100 in paise
      currency: "INR",
      receipt: `rcpt_${req.user._id}`,
      notes: {
        userId: req.user._id.toString(), // 🔥 IMPORTANT
      },
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Payment order failed" });
  }
};
module.exports=createOrder;
