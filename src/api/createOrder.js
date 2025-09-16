// src/api/createOrder.js
import express from "express";
import Razorpay from "razorpay";
import { supabase } from "../utils/supabase.js";

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/", async (req, res) => {
  try {
    const { artworkId } = req.body;

    // Fetch artwork and validate
    const { data: artwork, error } = await supabase
      .from("artworks")
      .select("cost")
      .eq("id", artworkId)
      .single();
    if (error || !artwork) {
      return res.status(400).json({ error: "Invalid artwork ID" });
    }

    const amount = Number(artwork.cost) + Number(process.env.DELIVERY_FEE || 50);
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${artworkId}_${Date.now()}`,
    });

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

export default router;
