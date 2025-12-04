import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";

// Initialize Groq client only when needed
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

export const translateMessage = action({
  args: {
    text: v.string(),
    targetLanguage: v.string(),
    sourceLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { text, targetLanguage, sourceLanguage } = args;

    try {
      const groq = getGroqClient();

      const prompt = sourceLanguage
        ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else.\n\nText: ${text}`
        : `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else.\n\nText: ${text}`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Translate the given text accurately while preserving the original meaning, tone, and style. Return only the translated text without any explanations or additional commentary.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1000,
      });

      const translatedText =
        completion.choices[0]?.message?.content || "Translation failed";

      return {
        success: true,
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
      };
    } catch (error) {
      console.error("Translation error:", error);
      return {
        success: false,
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        error: "Translation failed. Please try again.",
      };
    }
  },
});

export const detectLanguage = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const groq = getGroqClient();

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a language detection expert. Identify the language of the given text. Return only the language name in English (e.g., 'English', 'Spanish', 'French', 'German', 'Chinese', etc.). Nothing else.",
          },
          {
            role: "user",
            content: `Detect the language of this text: ${args.text}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 20,
      });

      const detectedLanguage =
        completion.choices[0]?.message?.content?.trim() || "Unknown";

      return {
        success: true,
        language: detectedLanguage,
      };
    } catch (error) {
      console.error("Language detection error:", error);
      return {
        success: false,
        language: "Unknown",
      };
    }
  },
});
