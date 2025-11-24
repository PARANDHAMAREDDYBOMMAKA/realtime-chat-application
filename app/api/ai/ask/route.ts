import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { groq, DEFAULT_MODEL } from "@/lib/groq/client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask questions about a conversation
 *     description: Uses AI to answer questions based on conversation context
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
 *               - question
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: The ID of the conversation
 *                 example: "jh7x8k9l2m3n4o5p"
 *               question:
 *                 type: string
 *                 description: The question to ask about the conversation
 *                 example: "What decisions were made in this conversation?"
 *               messageLimit:
 *                 type: number
 *                 description: Maximum number of recent messages to analyze (default 100)
 *                 example: 50
 *     responses:
 *       200:
 *         description: Answer generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: The AI-generated answer
 *                 question:
 *                   type: string
 *                   description: The original question
 *                 conversationId:
 *                   type: string
 *                   description: The conversation ID
 *                 messagesAnalyzed:
 *                   type: number
 *                   description: Number of messages analyzed
 *       400:
 *         description: Bad request - Missing required fields
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
    const { conversationId, question, messageLimit = 100 } = body;

    if (!conversationId || !question) {
      return NextResponse.json(
        { error: "conversationId and question are required" },
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
      .reverse()
      .map((msg) => {
        const content =
          msg.message.type === "text"
            ? msg.message.content
            : `[${msg.message.type}]`;
        const timestamp = new Date(msg.message._creationTime).toLocaleString();
        return `[${timestamp}] ${msg.senderName}: ${content}`;
      })
      .join("\n");

    const systemPrompt = `You are a helpful AI assistant that answers questions about conversations.

Instructions:
- Analyze the conversation context carefully
- Provide accurate, specific answers based on the messages
- If the information isn't available in the conversation, say so
- Include relevant details like who said what and when
- Be concise but thorough
- Use a friendly, conversational tone`;

    // Generate answer using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Here is the conversation:\n\n${formattedMessages}\n\nQuestion: ${question}`,
        },
      ],
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 800,
    });

    const answer = completion.choices[0]?.message?.content || "Unable to generate answer";

    return NextResponse.json({
      answer,
      question,
      conversationId,
      messagesAnalyzed: messages.length,
    });
  } catch (error) {
    console.error("Error answering question:", error);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
