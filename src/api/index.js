// src/api/index.js
import express from "express";
import bodyParser from "body-parser";
import createOrderRoute from "./createOrder.js";
import verifyPaymentRoute from "./verifyPayment.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Mount our API routes
app.use("/api/create-order", createOrderRoute);
app.use("/api/verify-payment", verifyPaymentRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
