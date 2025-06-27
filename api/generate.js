
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
        prompt: Transform only the face and head of the subject in the uploaded image into a silly, LowIQ-style cartoon version. Maintain the original human facial features and exact skin tone—do not replace with any animal or fictional character style such as frog faces or known meme characters.

Slightly enlarge the head for a comical effect. Add crossed, unfocused cartoon eyes with exaggerated white space, preserving original size and direction. Overlay an open mouth with a dumb expression and blue drool, but retain the real mouth shape underneath.

Redraw hair, ears, and eyebrows using rough, hand-drawn lines that match the original shapes. Keep skin color and head structure untouched.

Add a visible “LOWIQ” badge on the subject’s clothing in a cartoonish, sketchy font.

Do not transform the subject into recognizable characters (e.g. Pepe, Wojak, Trollface, Shrek, etc). Ensure it stays true to the original person's identity, only adding dumb/funny facial stylization.

Use a flat, pastel-colored, cartoon style with no shading, wobbly outlines, and a crude illustration feel. Do not alter body, background, or pose—modify only the head and face as described.`,
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
