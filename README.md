# Spur AI Support Agent

A mini AI support agent for a live chat widget, built for the Spur Founding Full-Stack Engineer Take-Home assignment.

## Features
- **Real-time AI Chat**: Powered by OpenAI (GPT-4o).
- **Session Persistence**: Conversations are saved and can be resumed on reload.
- **FAQ Knowledge**: Seeding the agent with fictional store info (Shipping, Returns, Hours).
- **Premium UI**: Modern, glassmorphism-inspired design with "typing" indicators and auto-scroll.
- **Robustness**: Handles empty messages and API errors gracefully.

## Tech Stack
- **Backend**: Node.js + TypeScript + Express.
- **Database**: SQLite with Prisma ORM.
- **LLM**: OpenAI API.
- **Frontend**: React + TypeScript + Vite + Vanilla CSS.

## Prerequisites
- Node.js (v18+)
- OpenAI API Key

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env` file (or edit the existing one) and add:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your_gemini_api_key_here"
   XAI_API_KEY="your_grok_api_key_here"
   LLM_PROVIDER="gemini" # or "grok"
   PORT=3001
   ```
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the server:
   ```bash
   npm run dev # or: npx ts-node src/server.ts
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the app at [http://localhost:3000](http://localhost:3000).

## Architecture Overview

### Backend
- **Layers**: 
  - `routes/`: Defines API endpoints.
  - `controllers/`: Handles request logic and database interactions via Prisma.
  - `services/`: Encapsulates external logic like LLM (OpenAI) and DB client.
- **Design Decisions**:
  - Used Prisma 7 logic where `url` is handled in `prisma.config.ts` and `.env`.
  - SQLite used for simplicity as requested.
  - LLM integration is wrapped in a service for easy swapping/testing.

### LLM Notes
- **Provider**: OpenAI (GPT-4o).
- **Prompting**: System prompt includes a hardcoded FAQ knowledge base about "Spur E-commerce Store".
- **Context**: Recent message history is passed to the LLM to maintain conversation context.

## Trade-offs & "If I had more time..."
- **Auth**: No auth was implemented per requirements. If adding more channels (WhatsApp, IG), a robust auth/identity system would be needed.
- **Vector DB**: For a larger FAQ, I would use RAG (Retrieval-Augmented Generation) with a vector database like Pinecone or pgvector.
- **Streaming**: Implementing SSE or WebSockets for streaming AI responses would improve the "real-time" feel.
- **Unit Tests**: I would add Vitest for the backend logic and React Testing Library for the UI.
