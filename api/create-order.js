export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ message: "Expected application/json" });
  }

  const { amount } = req.body || {};
  const normalizedAmount = Number(amount);

  if (!Number.isInteger(normalizedAmount) || normalizedAmount < 100 || normalizedAmount > 2000000) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: "Razorpay configuration missing" });
  }

  try {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: normalizedAmount,
        currency: "INR",
        receipt: `adm_${Date.now()}`,
        payment_capture: 1,
        notes: {
          source: "website_admission"
        }
      })
    });

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text();
      return res.status(502).json({ message: "Failed to create order", details: errorBody });
    }

    const order = await razorpayResponse.json();
    return res.status(200).json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    return res.status(500).json({ message: "Could not initialize payment" });
  }
}
