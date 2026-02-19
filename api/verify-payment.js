import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { payment_id, order_id, signature, formData } = req.body;

  const body = order_id + "|" + payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: "Invalid payment" });
  }

  // Payment verified → Send to Google Sheet
  const scriptURL = process.env.GOOGLE_SCRIPT_URL;

  await fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify({
      ...formData,
      payment: "Paid",
      payment_id: payment_id
    }),
    headers: { "Content-Type": "application/json" }
  });

  return res.status(200).json({ success: true });
}
