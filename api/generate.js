
export default async function handler(req, res) {
  const imageUrl = req.body.imageUrl;
  const replicateKey = process.env.REPLICATE_API_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Step 1: Submit prediction
  const predictionResponse = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        prompt: `Slightly enlarge the head for a cartoonish look, while preserving facial structure.

Add crossed, unfocused cartoon eyes with visible white space, keeping original eye size and orientation.

Overlay an open mouth with a silly expression and blue drool, without changing the actual mouth shape.

Keep hair, ears, eyebrows structure intact—just redraw in a hand-drawn cartoon style.

if dont have ears, dont add ears.

Preserve skin tone exactly from the image.

Add a sketchy “LOWIQ” badge to the subject’s clothing.

Use flat pastel or garish colors, no shading, wobbly cartoon lines.

Do not change clothing, body, background, or pose.`,
        input_images: [imageUrl],
        openai_api_key: openaiKey,
        quality: "high",
        background: "auto",
        moderation: "auto",
        aspect_ratio: "1:1",
        output_format: "png",
        number_of_images: 1,
        output_compression: 50
      }
    })
  });

  const prediction = await predictionResponse.json();

  if (!prediction?.id) {
    return res.status(500).json({ error: "Failed to start prediction." });
  }

  const predictionId = prediction.id;

  // Step 2: Poll until complete
  const pollUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
  let output = null;
  let tries = 0;

  while (tries < 30) {
    await new Promise(resolve => setTimeout(resolve, 4000)); // wait 2 sec
    const pollRes = await fetch(pollUrl, {
      headers: {
        "Authorization": `Bearer ${replicateKey}`
      }
    });
    const pollData = await pollRes.json();
    if (pollData?.status === "succeeded") {
      output = pollData.output;
      break;
    } else if (pollData?.status === "failed") {
      return res.status(500).json({ error: "Replicate failed to generate image." });
    }
    tries++;
  }

  if (!output) {
    return res.status(504).json({ error: "Timeout waiting for Replicate result." });
  }

  res.status(200).json({ output });
}
