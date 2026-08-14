const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("prompt");
const statusBox = document.getElementById("status");
const videoBox = document.getElementById("videoBox");
const resultVideo = document.getElementById("resultVideo");

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    alert("Pehle video prompt likho.");
    return;
  }

  generateBtn.disabled = true;
  statusBox.style.display = "block";
  videoBox.style.display = "none";
  statusBox.textContent = "⏳ Veo 3.1 video generate ho raha hai...";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        prompt: prompt,
        aspectRatio: document.getElementById("aspectRatio").value
      })
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Server route error (${response.status}). Check Vercel logs and API key.`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Video generation failed.");
    }

    if (!data.videoUrl) {
      throw new Error("Video URL nahi mila.");
    }

    resultVideo.src = data.videoUrl;
    videoBox.style.display = "block";
    statusBox.textContent = "✅ Video ready hai!";

  } catch (error) {
    console.error(error);
    statusBox.textContent = "❌ " + error.message;
  } finally {
    generateBtn.disabled = false;
  }
});
