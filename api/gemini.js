export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  const { prompt, system, tts } = req.body;

  try {
    const body = tts
      ? {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        }
      : {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: system
                    ? `${system}\n\nUser: ${prompt}`
                    : prompt
                }
              ]
            }
          ]
        };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    console.log("Gemini raw:", JSON.stringify(data));

    if (tts) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Puck"
              }
            }
          }
        }
      })
    }
  );

  const data = await response.json();
  console.log("TTS raw:", JSON.stringify(data));

  const audio =
    data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audio) {
    return res.status(200).json({ error: "No audio returned" });
  }

  return res.status(200).json({ audio });
}


    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from AI";

    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI request failed" });
  }
}
