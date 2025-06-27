
export default async function handler(req, res) {
  const imageUrl = req.body.imageUrl;

  const replicateKey = process.env.REPLICATE_API_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.replicate.com/v1/models/openai/gpt-image-1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },
    body: JSON.stringify({
      input: {
        prompt: `LowIQ Meme-Style Cartoon Transformation (Safe Version)

Transform only the face and head of the person in the image into a lighthearted cartoon parody, keeping facial features (eyes, nose, mouth, skin tone, head shape) close to the original.

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

  const result = await response.json();
  res.status(200).json(result);
}
