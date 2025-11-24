# Converse API Documentation

Complete API documentation for Converse - A modern real-time chat application with AI capabilities.

## 📚 Interactive Documentation

Access the full interactive Swagger documentation at:
```
http://localhost:3000/docs
```

**Features:**
- ✨ Light theme UI
- 🎯 Try-it-out functionality
- 📝 Complete request/response schemas
- 🔐 Authentication examples
- ⚡ Real-time request testing

## API Overview

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require Clerk authentication via Bearer token:
```
Authorization: Bearer <your_clerk_token>
```

## API Categories

### 🤖 AI Assistant
AI-powered features using Groq API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/summarize` | POST | Generate conversation summaries |
| `/api/ai/suggest-response` | POST | Get AI response suggestions |
| `/api/ai/ask` | POST | Ask questions about conversations |

**Key Features:**
- Multiple summary types (brief, detailed, bullet-points)
- Tone control for suggestions (casual, professional, friendly, formal)
- Context-aware Q&A
- Powered by Llama 3.3 70B

### 👤 User
User profile and authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/current` | GET | Get current user profile |

**Caching:** 10 minutes

### 💬 Conversations
Conversation management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | Get all user conversations |

**Features:**
- DM and group conversations
- Last message preview
- Unread counts
- User online status
- **Caching:** 1 minute

### 📨 Messages
Message retrieval and management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messages/[conversationId]` | GET | Get messages for a conversation |

**Support:**
- Text, images, videos, audio, files
- Pagination
- Real-time updates via Convex

### 👥 Friends
Friend list and requests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/friends` | GET | Get user's friends |
| `/api/friends/requests` | GET | Get friend requests |

**Features:**
- Online/offline status
- Last seen timestamps
- **Caching:** 5 minutes

### 📖 Stories
24-hour ephemeral stories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stories` | GET | Get friends' stories |

**Features:**
- Image and video stories
- 24-hour expiration
- View tracking
- **Caching:** 24 hours

### 🔍 Search
Message and conversation search

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Search messages |

**Parameters:**
- `q` (required): Search query
- `conversationId` (optional): Limit search to conversation

**Caching:** 1 week

### 💾 Cache
Redis cache management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cache/get` | GET | Get cached data |
| `/api/cache/set` | POST | Set cache data |
| `/api/cache/invalidate` | POST | Invalidate cache |
| `/api/cache/refresh` | POST | Refresh cache |
| `/api/cache/warm` | POST | Warm up cache |

### 🎫 Support
Support ticket system

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/support` | GET | Get user's support tickets |

**Features:**
- Ticket status tracking
- Priority levels
- **Caching:** 1 week

### 😊 Reactions
Message reactions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reactions/[messageId]` | POST | Add reaction to message |
| `/api/reactions/[messageId]` | DELETE | Remove reaction |

### 📹 Rooms
Video/audio call rooms

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rooms` | GET | Get active rooms |
| `/api/rooms/[roomId]` | GET | Get room details |

### 🎥 LiveKit
Video/audio call token generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/livekit/token` | POST | Generate LiveKit access token |

### ❤️ Health
System health monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API health status |

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T...",
  "service": "converse"
}
```

## Caching Strategy

Converse uses Redis (Upstash) for intelligent caching:

| Data Type | TTL | Strategy |
|-----------|-----|----------|
| User Profile | 10 min | Cache-aside |
| Conversations | 1 min | Cache-aside |
| Friends | 5 min | Cache-aside |
| Stories | 24 hours | Cache-aside |
| Search Results | 1 week | Cache-aside |
| Support Tickets | 1 week | Cache-aside |

## Error Responses

All endpoints follow consistent error formats:

### 400 Bad Request
```json
{
  "error": "conversationId is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Testing the API

### Using Swagger UI
1. Navigate to `http://localhost:3000/docs`
2. Click "Authorize" button
3. Enter your Clerk Bearer token
4. Try out any endpoint

### Using cURL
```bash
# Get current user
curl -X GET http://localhost:3000/api/user/current \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# Search messages
curl -X GET "http://localhost:3000/api/search?q=hello" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"

# AI Summary
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "xxx", "summaryType": "brief"}'
```

## Tech Stack

- **Framework:** Next.js 15
- **Database:** Convex
- **Caching:** Redis (Upstash)
- **Authentication:** Clerk
- **Real-time:** Convex subscriptions
- **Video/Audio:** LiveKit
- **AI:** Groq API (Llama 3.3 70B)
- **Documentation:** Swagger/OpenAPI 3.0

## Development

### Running Locally
```bash
npm run dev
```

### Viewing Documentation
```bash
open http://localhost:3000/docs
```

### Environment Variables
See `.env.local` for required environment variables.

## Support

For API issues or questions:
- Check the interactive docs at `/docs`
- Review this documentation
- Open an issue on GitHub

---

**Last Updated:** January 2025
**API Version:** 1.0.0
