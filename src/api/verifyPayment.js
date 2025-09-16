// src/api/verifyPayment.js
import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.json({ success: true });
    }
    res.status(400).json({ success: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;
