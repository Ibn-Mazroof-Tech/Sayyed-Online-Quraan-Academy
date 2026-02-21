import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ success: false, message: "Expected application/json" });
  }

  const { payment_id, order_id, signature, formData } = req.body || {};

  if (!payment_id || !order_id || !signature || !formData) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET || !process.env.GOOGLE_SCRIPT_URL) {
    return res.status(500).json({ success: false, message: "Server configuration missing" });
  }

  const body = order_id + "|" + payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: "Invalid payment" });
  }

  try {
    const sheetResponse = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        ...formData,
        payment: "Paid",
        payment_id: payment_id,
        order_id: order_id
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (!sheetResponse.ok) {
      return res.status(502).json({ success: false, message: "Failed to sync admission record" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
}
