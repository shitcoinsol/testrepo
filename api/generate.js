
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
        prompt: `Use the provided images to compose a single final image.

1. Use the character image as the base. Do not alter the character’s original pose, facial expression, body proportions, or art style. Preserve its overall aesthetic and visual identity exactly.

2. Overlay the Moonshot cap image onto the character’s head. The cap should fit naturally, following the character’s head angle, lighting, and style. Replace any existing headgear if necessary.

3. Add the Moonshot hoodie onto the character’s body, fitting it naturally over the torso and shoulders. Ensure the hoodie aligns with the character’s posture and blends seamlessly with the image style. The Moonshot logo on the hoodie should remain clearly visible.

4. Set the background to the Moonshot background image. It should fully replace the original background, while maintaining harmony with the character and added clothing items.

Make sure all composited elements match the lighting, shading, and cartoon/illustration style of the original character image. Do not introduce any new elements. The final output must look like a cohesive, professionally edited version of the original character wearing Moonshot gear in a Moonshot-themed setting.`,
         input_images: [
  imageUrl,
  "https://bkvgmmxrcldjoofqmprk.supabase.co/storage/v1/object/public/uploads/moon-hood.png",
  "https://bkvgmmxrcldjoofqmprk.supabase.co/storage/v1/object/public/uploads/moon-cap.png",
  "https://bkvgmmxrcldjoofqmprk.supabase.co/storage/v1/object/public/uploads/moon-bg.png"
],
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
