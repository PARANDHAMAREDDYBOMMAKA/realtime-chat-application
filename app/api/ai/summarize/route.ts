import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { groq, DEFAULT_MODEL } from "@/lib/groq/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * @swagger
 * /api/ai/summarize:
 *   post:
 *     summary: Generate a summary of conversation messages
 *     description: Uses Groq AI to analyze and summarize a conversation's message history
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
 *                 description: The ID of the conversation to summarize
 *                 example: "jh7x8k9l2m3n4o5p"
 *               messageLimit:
 *                 type: number
 *                 description: Maximum number of recent messages to include (default 100)
 *                 example: 50
 *               summaryType:
 *                 type: string
 *                 enum: [brief, detailed, bullet-points]
 *                 description: Type of summary to generate (default brief)
 *                 example: "brief"
 *     responses:
 *       200:
 *         description: Summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: The generated summary
 *                 messageCount:
 *                   type: number
 *                   description: Number of messages analyzed
 *                 conversationId:
 *                   type: string
 *                   description: The conversation ID
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
    const { conversationId, messageLimit = 100, summaryType = "brief" } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Get auth token from request
    const token = await authResult.getToken({ template: "convex" });

    // Initialize Convex client with auth
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token!);

    // Fetch messages from Convex
    const messages = await convex.query(api.messages.get, {
      id: conversationId,
      limit: messageLimit,
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found in this conversation" },
        { status: 404 }
      );
    }

    // Format messages for AI analysis
    const formattedMessages = messages
      .reverse() // Show chronological order
      .map((msg) => {
        const content =
          msg.message.type === "text"
            ? msg.message.content
            : `[${msg.message.type}]`;
        return `${msg.senderName}: ${content}`;
      })
      .join("\n");

    // Create prompt based on summary type
    let systemPrompt = "";
    switch (summaryType) {
      case "detailed":
        systemPrompt =
          "You are a helpful assistant that summarizes conversations. Provide a detailed summary including main topics, key points, decisions made, and action items. Use clear paragraphs.";
        break;
      case "bullet-points":
        systemPrompt =
          "You are a helpful assistant that summarizes conversations. Provide a concise summary using bullet points. Include:\n- Main topics discussed\n- Key decisions or conclusions\n- Important action items\n- Notable mentions";
        break;
      default:
        systemPrompt =
          "You are a helpful assistant that summarizes conversations. Provide a brief, concise summary in 2-3 sentences highlighting the main topic and key points.";
    }

    // Generate summary using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please summarize the following conversation:\n\n${formattedMessages}`,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: summaryType === "detailed" ? 1000 : 500,
    });

    const summary = completion.choices[0]?.message?.content || "Unable to generate summary";

    return NextResponse.json({
      summary,
      messageCount: messages.length,
      conversationId,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
