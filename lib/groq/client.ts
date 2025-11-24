import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Default model to use - Llama 3.3 70B is fast and powerful
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Alternative models available on Groq:
// - llama-3.3-70b-versatile (latest, balanced speed and quality)
// - llama-3.1-8b-instant (fastest, good for quick responses)
// - mixtral-8x7b-32768 (good for longer contexts)
// - gemma2-9b-it (Google's Gemma, good alternative)
