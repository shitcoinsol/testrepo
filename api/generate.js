
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
        prompt: `Transform only the face and head of the person in the image into a lighthearted cartoon parody, keeping facial features (eyes, nose, mouth, skin tone, head shape) close to the original.

Slightly enlarge the head for a comical cartoon look while keeping structure.

Add crossed, playful cartoon eyes with visible white space, matching the original size and direction.

Overlay a silly open mouth with blue cartoon drool, without altering the real mouth shape.

Preserve original skin tone exactly.

Redraw hair, ears, eyebrows in a hand-drawn sketch style, keeping structure intact.

Add a visible “LOWIQ” parody badge on clothing in a comic, sketchy style.

Use a cartoonish style with shaky outlines, no shading, and pastel or clashing colors.

Do not modify clothing, body, background, or pose.`,
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
