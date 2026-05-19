import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Razorpay Initialization
// Note: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be provided by the user in the settings.
// I will use placeholders that indicate they need to be filled.
const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
        throw new Error("Razorpay API keys are missing in environment variables.");
    }
    
    return new Razorpay({
        key_id,
        key_secret,
    });
};

// API: Create Razorpay Order
app.get("/api/razorpay/key", (req, res) => {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post("/api/razorpay/order", async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        const razorpay = getRazorpay();

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise for INR)
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

// API: Verify Razorpay Payment
app.post("/api/razorpay/verify", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_secret) {
            return res.status(500).json({ error: "Razorpay secret missing" });
        }

        const generated_signature = crypto
            .createHmac("sha256", key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {
            res.status(200).json({ status: "success", message: "Payment verified successfully" });
        } else {
            res.status(400).json({ status: "failure", message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Verification failed" });
    }
});

async function startServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
