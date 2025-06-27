
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
        prompt: `Transform only the face and head of the subject in the uploaded image into a ‘LowIQ’ meme-style cartoon version, while keeping all facial features (eye shape, nose, mouth placement, skin tone, and head proportions) as close as possible to the original image.

Apply the following **style transformation only**:
- Slight exaggeration of the head into a slightly larger, cartoonish shape, but keep the subject’s real facial structure recognizable.
- Add unfocused, crossed cartoon-style eyes with visible white space, but match the subject's original eye size and orientation as closely as possible.
- Add an open mouth with a silly drooling expression and blue saliva, but **do not change the original mouth shape**—overlay the expression naturally.
- Maintain exact skin tone from the source image.
- Keep hair and all other facial features (eyebrows, ears) intact in structure, only redraw them in a cartoon hand-drawn style.
- Add a visible “LOWIQ” badge to the subject’s clothing, in the same sketchy cartoon style.

Use a cartoonish, hand-drawn illustration style with shaky lines, no shading, and flat pastel or garish colors. Do not alter the clothing, body, background, or pose.`,
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
