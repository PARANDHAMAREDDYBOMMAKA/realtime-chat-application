import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Converse API with AI Assistant",
    version: "1.0.0",
    description:
      "API documentation for Converse - a modern chat application with AI-powered features including conversation summarization, smart response suggestions, and context-aware Q&A",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      description: "Application Server",
    },
  ],
  tags: [
    {
      name: "AI Assistant",
      description: "AI-powered chat assistant endpoints using Groq API for summarization, response suggestions, and Q&A",
    },
    {
      name: "User",
      description: "User profile and authentication endpoints",
    },
    {
      name: "Conversations",
      description: "Conversation list and management endpoints",
    },
    {
      name: "Messages",
      description: "Message retrieval, sending, and management endpoints",
    },
    {
      name: "Friends",
      description: "Friend list and friend request management",
    },
    {
      name: "Stories",
      description: "Story feed and story management endpoints",
    },
    {
      name: "Search",
      description: "Message and conversation search endpoints",
    },
    {
      name: "Cache",
      description: "Redis cache management and invalidation endpoints",
    },
    {
      name: "Support",
      description: "Support ticket management endpoints",
    },
    {
      name: "Reactions",
      description: "Message reaction endpoints",
    },
    {
      name: "Rooms",
      description: "Video/audio call room management",
    },
    {
      name: "LiveKit",
      description: "LiveKit token generation for video/audio calls",
    },
    {
      name: "Health",
      description: "System health check endpoints",
    },
  ],
  components: {
    securitySchemes: {
      ClerkAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Clerk authentication token",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./app/api/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJSDoc(options);
