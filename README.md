# Nexus AI — Intelligent Chat Assistant

Nexus AI is an enterprise-grade AI chat assistant built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB**. Featuring true real-time Server-Sent Events (SSE) streaming from the OpenAI API, dynamic tone customization (Professional, Casual, Concise), full conversation persistence, response regeneration, and text transcript export.

---

## 🚀 Key Features

- **Genuine Real-Time AI Streaming**: Real server-side streaming via OpenAI API and native ReadableStream / Server-Sent Events (SSE). No simulated token animations.
- **Dynamic Tone Selector**: Switch between 3 contextual modes anytime:
  - 💼 **Professional**: Structured, respectful, clear, and technically accurate.
  - ✨ **Casual**: Friendly, warm, conversational, and accessible.
  - ⚡ **Concise**: Direct, short, to-the-point answers preserving essential context.
- **Persistent Conversation History**: Stored securely in MongoDB Atlas via Mongoose with auto-generated conversation titles based on initial prompts.
- **Response Regeneration**: Re-run the latest AI completion using the updated tone without duplicate messages.
- **Export Conversation**: Instant one-click TXT transcript download with full metadata, timestamps, and message threads.
- **Developer-Centric UI**:
  - Dark-mode SaaS aesthetics (`#0B0D12` background, `#11141C` sidebar).
  - Code block syntax highlighting with copy-to-clipboard button.
  - Full markdown formatting via `react-markdown` and `remark-gfm`.
  - Multi-line textarea with auto-expansion, `Enter` to submit, `Shift + Enter` for line breaks.
  - Collapsible desktop sidebar and responsive mobile drawer.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React |
| **Backend** | Next.js API Routes (Node.js runtime), Server-Sent Events (SSE) / Web Streams |
| **AI Engine** | OpenAI API (`gpt-4o-mini` default, customizable) |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Markdown & Code** | `react-markdown`, `remark-gfm`, `rehype-highlight` |

---

## 📦 Project Structure

```
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts            # POST /api/chat (real-time AI streaming & persistence)
│   │   │   └── conversations/
│   │   │       ├── route.ts            # GET /api/conversations (list & summaries)
│   │   │       └── [id]/
│   │   │           └── route.ts        # GET, DELETE, PATCH /api/conversations/[id]
│   │   ├── globals.css                 # Dark theme & code syntax styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Main Chat application coordinator
│   ├── components/
│   │   ├── ChatInput.tsx               # Auto-resizing input, tone pill, send/stop controls
│   │   ├── ChatMessage.tsx             # Markdown renderer, code highlighter, copy & regenerate
│   │   ├── ChatWindow.tsx              # Message scroll stream, auto-scroll, alert banners
│   │   ├── Header.tsx                  # Top navigation, active title, tone switcher, export
│   │   ├── Sidebar.tsx                 # Branding, new chat, conversation history, collapse/drawer
│   │   ├── ToneSelector.tsx            # 3-mode tone segmented toggle
│   │   └── WelcomeScreen.tsx           # Hero section with interactive suggestion cards
│   ├── lib/
│   │   ├── exportChat.ts               # TXT export generator
│   │   ├── mongodb.ts                  # Cached Mongoose connection utility
│   │   ├── openai.ts                   # OpenAI client initialization
│   │   └── prompts.ts                  # Tone-specific system prompts
│   ├── models/
│   │   └── Conversation.ts             # Mongoose schema for conversations & messages
│   └── types/
│       └── chat.ts                     # TypeScript interfaces & types
└── README.md
```

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your credentials:
   ```env
   # MongoDB Connection String (MongoDB Atlas or local MongoDB instance)
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nexus_ai?retryWrites=true&w=majority

   # AI Provider Option A: Google Gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3-flash-preview

   # AI Provider Option B: OpenAI
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4o-mini
   ```

### MongoDB Setup
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- In **Network Access**, allow access from your IP or `0.0.0.0/0`.
- In **Database Access**, create a user with Read and Write permissions.
- Click **Connect** -> **Drivers** -> Copy the connection URI and paste it into `MONGODB_URI`.

### OpenAI API Setup
- Sign up or log in to [platform.openai.com](https://platform.openai.com/).
- Navigate to **API Keys** and generate a new secret key.
- Paste your key into `OPENAI_API_KEY`.

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore Nexus AI.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Testing & Verification Checklist

- [x] **Real-time Streaming**: Tokens render progressively as OpenAI produces them.
- [x] **Tone Adaptation**: Responses dynamically change style according to Professional, Casual, or Concise instructions.
- [x] **Database Persistence**: Chats and messages are saved and restored on reload.
- [x] **Regenerate Response**: Replaces the last response with a fresh completion.
- [x] **Export Chat**: Downloads clean `.txt` conversation transcript with full timestamps.
- [x] **Deletion**: Deletes conversations from MongoDB with live UI update.
