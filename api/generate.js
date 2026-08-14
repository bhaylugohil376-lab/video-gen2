export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY environment variable missing on Vercel."
      });
    }

    // OpenRouter Request
    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "AI Video Studio"
      },
      body: JSON.stringify({
        model: "google/veo-3.1-fast",
        prompt: prompt,
        aspect_ratio: aspectRatio || "16:9"
      })
    });

    const initialData = await openrouterResponse.json();

    if (!openrouterResponse.ok) {
      return res.status(openrouterResponse.status).json({
        error: initialData?.error?.message || "OpenRouter video generation request failed."
      });
    }

    // Direct Video URL check
    if (initialData.video_url || initialData.url) {
      return res.status(200).json({ videoUrl: initialData.video_url || initialData.url });
    }

    // Status Polling Loop (Waiting for completion)
    const pollingUrl = initialData.polling_url || `https://openrouter.ai/api/v1/videos/${initialData.id}`;
    let videoUrl = null;
    let attempts = 0;

    while (!videoUrl && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(pollingUrl, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });

      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        if (pollData.status === "completed" || pollData.status === "succeeded") {
          videoUrl = pollData.video_url || pollData.output?.video || pollData.result;
          break;
        } else if (pollData.status === "failed") {
          throw new Error("Video processing failed on server.");
        }
      }
      attempts++;
    }

    if (!videoUrl) {
      return res.status(504).json({ error: "Video generation timed out." });
    }

    return res.status(200).json({ videoUrl: videoUrl });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
