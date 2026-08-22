import OpenAI from "openai";

const hasKey = !!process.env.OPENAI_API_KEY;

export const openai = hasKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateProductDescription(imageUrls: string[]): Promise<string | null> {
  if (!openai) {
    return null;
  }

  try {
    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: "Write a compelling, detailed product description for an online marketplace listing based on the uploaded images. Describe the item's appearance, condition, and notable features. Write in a friendly but professional tone. Do not mention photos or images.",
      },
    ];

    for (const url of imageUrls) {
      content.push({
        type: "image_url",
        image_url: { url, detail: "auto" },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("[AI] Failed to generate description:", error);
    return null;
  }
}
