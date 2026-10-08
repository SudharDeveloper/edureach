# EduReach — Agentic College Chatbot · Part 2 starter

Starter code for **Part 2: AI Chat Agent + AI Voice Agent**.

This is the finished Part 1 codebase — working signup/login/JWT auth plus the full static
college site. Download it and follow the Part 2 reading material from the start. If you
completed Part 1 yourself, you can keep using your own code instead.

> Part 2 is published as **two reading materials** — a chat-agent backend document
> (RAG, LangChain, Atlas Vector Search) followed by a document covering the chat frontend
> and the whole voice agent. Work through them in that order.

## Already working

- **Auth** — signup, login, bcrypt hashing, JWT issue/verify, protected-route middleware,
  global error handler
- **Frontend** — 14 components, login/signup pages, `AuthContext`, axios instance with a
  token interceptor, content gated behind login

`CallPopup.tsx` is a placeholder — you build the real one in Part 2.
`server/src/services/` and `server/knowledge-base/` are empty, waiting for your Part 2 files.

## You will build

**RAG chat agent** — `knowledge-base/edureach-knowledge.txt`, `knowledge-doc.model.ts`,
`rag.service.ts`, `chat.controller.ts`, `chat.routes.ts`, `chat.service.ts`,
`ChatDrawer.tsx`, `FloatingChatButton.tsx`

**Voice agent** — `vapi.service.ts` (server), `vapi.controller.ts`, `vapi.routes.ts`,
`vapi.service.ts` (client), and the real `CallPopup.tsx`

**Plus edits** to `app.ts`, `server.ts`, `App.tsx`, and `content.ts`.

## First-time setup

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # then fill in your own values
npm run dev               # http://localhost:5000
```

```bash
# 2. Frontend (second terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

### Environment variables

`.env.example` carries the Part 1 variables. Part 2 has you add `GOOGLE_API_KEY` and the
three `VAPI_*` variables as you reach those steps.

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any long random string you choose |
| `GOOGLE_API_KEY` | Google AI Studio (chat agent, Step 1) |
| `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID` | Vapi dashboard (voice agent, Step 1) |

**No new packages to install** — every LangChain dependency Part 2 needs is already in
`server/package.json`.

Requires **Node.js 24+** — the server runs `.ts` files directly, with no build step.

> `.env` is gitignored. Never commit real credentials.

## Session goal

Log in, open the chat drawer, and get an answer grounded in the college knowledge base
(not generic LLM knowledge). Then trigger a real outbound counselor call from `CallPopup`.
Note that chat stays silent until you create the Atlas **Vector Search index** in
*"Create Atlas Vector Search Index"* — the last step of the chat-agent backend document.
