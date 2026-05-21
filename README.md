# AI-Powered Customer Support Workspace

A full-stack MERN + AI application for managing customer support tickets with real-time messaging, AI-generated reply suggestions, sentiment analysis, and conversation summarization.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS 4 |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (bcrypt hashing) |
| Real-Time | Socket.IO |
| AI | Groq (Llama 3.3 70B) |

## Features

- **Authentication** — Register, login, JWT-based protected routes
- **Ticket Management** — Create, update status, close tickets with priority levels
- **Conversation Threads** — Send messages within tickets, view paginated history
- **AI Suggested Replies** — Generate professional support replies with conversation context
- **Sentiment Tagging** — Auto-classify message sentiment (positive/negative/neutral/urgent) via AI
- **Conversation Summarization** — Generate ticket summaries on demand
- **Real-Time Messaging** — Instant message delivery via Socket.IO
- **Search** — Full-text search across tickets and messages
- **Message Pagination** — Paginated message loading for long conversations

## Prerequisites

- Node.js 18+
- MongoDB (running locally or remote URI)
- Groq API key (free at https://console.groq.com)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and Groq API key
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/customer-support
JWT_SECRET=your-random-secret-key
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_api_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Run the Application

```bash
# Single command — starts both server and client
cd server
npm run dev
```

The server runs on `http://localhost:5000` and the client on `http://localhost:5173`.  
The Vite dev server proxies `/api` requests to the Express backend.

### Default Admin Account

On first startup, an admin account is auto-created if none exists:

| Field | Value |
|---|---|
| Email | `admin@email.com` |
| Password | `12345678` |

Use these credentials at `/login` to access the admin dashboard. Customers use `/contact` (no login required).

## Architecture Overview

```
client/                     # React + Vite frontend
├── src/
│   ├── components/         # Reusable UI (TicketCard, MessageBubble, SentimentBadge)
│   ├── context/            # AuthContext, SocketContext
│   ├── pages/              # Login, Register, Dashboard, TicketDetail
│   ├── services/           # Axios API client
│   └── types/              # Shared TypeScript interfaces

server/                     # Express + TypeScript backend
├── src/
│   ├── config/             # Environment and database configuration
│   ├── controllers/        # Route handlers (auth, tickets, messages, AI, search)
│   ├── middleware/          # Auth middleware, error handler
│   ├── models/             # Mongoose schemas (User, Ticket, Message)
│   ├── routes/             # Express route definitions
│   ├── services/           # Groq AI integration
│   ├── sockets/            # Socket.IO connection handling
│   └── types/              # Shared TypeScript types
```

### MongoDB Schema Design

- **User** — name, email (unique), hashed password, role (customer/admin)
- **Ticket** — title, status, priority, user (ref User), summary (AI-generated), timestamps
- **Message** — ticket (ref Ticket), sender (ref User), content, role (user/system), sentiment (AI-tagged), timestamps

All relationships use `ObjectId` references with `.populate()` for efficient querying.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/tickets` | Yes | List tickets (paginated, filterable by status) |
| POST | `/api/tickets` | Yes | Create ticket |
| GET | `/api/tickets/:id` | Yes | Get ticket details |
| PATCH | `/api/tickets/:id` | Yes | Update ticket (status, priority) |
| DELETE | `/api/tickets/:id` | Yes | Delete ticket |
| GET | `/api/tickets/:id/messages` | Yes | Get messages (paginated, newest first) |
| POST | `/api/tickets/:id/messages` | Yes | Send message (auto-tags sentiment) |
| POST | `/api/ai/:id/suggest-reply` | Yes | Generate AI suggested reply |
| POST | `/api/ai/:id/summarize` | Yes | Generate AI conversation summary |
| GET | `/api/search?q=keyword` | Yes | Search tickets and messages |

## AI Integration Approach

Three distinct Groq prompt templates are used:

1. **Suggested Reply** — Feeds the last 10 conversation messages + ticket title into a system prompt instructing the model to act as a professional support agent. Returns a context-aware draft reply.

2. **Sentiment Analysis** — Each user message is classified via a minimal prompt returning a single word label (positive/negative/neutral/urgent). Uses low temperature (0.1) for consistency.

3. **Conversation Summarization** — Full message history is sent with a summarization prompt. Returns a 2-3 sentence summary stored on the ticket.

All AI calls use the `llama-3.3-70b-versatile` model via Groq's fast inference API. Failures are gracefully handled with defaults.

## Assumptions

- Login/register pages are for support staff only (admins access the dashboard at `/dashboard`)
- Customers use the contact form at `/contact` — no login required, a JWT is issued on ticket creation
- The first admin account is auto-created on server startup (`admin@email.com` / `12345678`)
- MongoDB `$regex` is sufficient for search (no Elasticsearch needed)
- AI sentiment analysis runs synchronously on message creation (acceptable for low-volume)
- Socket.IO authentication happens via handshake token
- Client-side routing is handled by React Router (separate from backend)
- Vite dev server proxies `/api` and `/socket.io` to Express backend

## Bonus Features Implemented

- AI conversation summarization
- Message pagination (with "Load older messages" button)
- Auto sentiment tagging via AI on each message
