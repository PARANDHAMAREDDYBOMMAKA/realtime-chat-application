import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { groq, DEFAULT_MODEL } from "@/lib/groq/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * @swagger
 * /api/ai/suggest-response:
 *   post:
 *     summary: Get AI-suggested responses for a conversation
 *     description: Analyzes recent conversation context and suggests appropriate responses
 *     tags:
 *       - AI Assistant
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: The ID of the conversation
 *                 example: "jh7x8k9l2m3n4o5p"
 *               numberOfSuggestions:
 *                 type: number
 *                 description: Number of response suggestions (1-5, default 3)
 *                 example: 3
 *               tone:
 *                 type: string
 *                 enum: [casual, professional, friendly, formal]
 *                 description: Desired tone for suggestions (default casual)
 *                 example: "casual"
 *               contextMessages:
 *                 type: number
 *                 description: Number of recent messages to consider (default 10)
 *                 example: 10
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of suggested responses
 *                 conversationId:
 *                   type: string
 *                   description: The conversation ID
 *                 contextUsed:
 *                   type: number
 *                   description: Number of messages analyzed
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      conversationId,
      numberOfSuggestions = 3,
      tone = "casual",
      contextMessages = 10,
    } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Validate numberOfSuggestions
    const validatedCount = Math.min(Math.max(numberOfSuggestions, 1), 5);

    // Get auth token from request
    const token = await authResult.getToken({ template: "convex" });

    // Initialize Convex client with auth
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token!);

    // Fetch recent messages for context
    const messages = await convex.query(api.messages.get, {
      id: conversationId,
      limit: contextMessages,
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found in this conversation" },
        { status: 404 }
      );
    }

    // Format messages for AI analysis (chronological order)
    const formattedMessages = messages
      .reverse()
      .slice(-contextMessages)
      .map((msg) => {
        const content =
          msg.message.type === "text"
            ? msg.message.content
            : `[${msg.message.type}]`;
        return `${msg.senderName}: ${content}`;
      })
      .join("\n");

    // Get the last message to respond to
    const lastMessage = messages[0];
    const lastSender = lastMessage.senderName;
    const lastContent =
      lastMessage.message.type === "text"
        ? lastMessage.message.content
        : `[${lastMessage.message.type}]`;

    // Create tone-specific system prompt
    const toneInstructions = {
      casual: "friendly, relaxed, and conversational",
      professional: "polite, clear, and business-appropriate",
      friendly: "warm, enthusiastic, and supportive",
      formal: "respectful, proper, and well-structured",
    };

    const systemPrompt = `You are a helpful AI assistant that suggests appropriate responses to messages. Generate ${validatedCount} different response suggestions that are ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.casual}.

Each suggestion should:
- Be contextually appropriate based on the conversation
- Be concise (1-2 sentences)
- Sound natural and human-like
- Offer variety in approach
- Be ready to send as-is

Format your response as a JSON array of strings, nothing else. Example: ["Response 1", "Response 2", "Response 3"]`;

    // Generate suggestions using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Based on this conversation:\n\n${formattedMessages}\n\nThe last message was from ${lastSender}: "${lastContent}"\n\nGenerate ${validatedCount} appropriate response suggestions.`,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.9, // Higher creativity for diverse suggestions
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";

    // Parse the JSON response
    let suggestions: string[] = [];
    try {
      // Extract JSON array from response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        suggestions = responseText
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .slice(0, validatedCount);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback suggestions
      suggestions = [
        "Thanks for sharing that!",
        "That makes sense, tell me more.",
        "Interesting! I'd love to hear your thoughts.",
      ].slice(0, validatedCount);
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, validatedCount),
      conversationId,
      contextUsed: messages.length,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
