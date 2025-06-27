
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const imageUrl = req.body.imageUrl;

  const replicateKey = "r8_8WYsrSaeDtz7lruntID39esDEl2lgmj4avXjF";
  const openaiKey = "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";

  try {
    const response = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer r8_8WYsrSaeDtz7lruntID39esDEl2lgmj4avXjF`,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          prompt: `Slightly enlarge the head for a cartoonish look, while preserving facial structure.

Add crossed, unfocused cartoon eyes with visible white space, keeping original eye size and orientation.

Overlay an open mouth with a silly expression and blue drool, without changing the actual mouth shape.

Keep hair, ears, eyebrows structure intact—just redraw in a hand-drawn cartoon style.

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

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
