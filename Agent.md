# AGENT INSTRUCTIONS & PROJECT GUIDELINES: ChatDigest

> **Product**: ChatDigest — WhatsApp Group Chat Summarizer & Grounded Q&A  
> **Status**: MVP + "Ask the Chat" (Feature 2) Implemented & Verified  
> **Document References**: [`SRD.md`](file:///c:/Users/Vikram%20Kumar/Desktop/Projects/ChatDigest/SRD.md) & [`SRD2.md`](file:///c:/Users/Vikram%20Kumar/Desktop/Projects/ChatDigest/SRD2.md)

---

## 1. Project Overview & Core Mission

**ChatDigest** is an AI-powered web application that processes exported WhatsApp group chats (`.txt` files) and produces:
1. **Structured, Verifiable Summaries** for a user-defined timeframe.
2. **"Ask the Chat" Grounded Q&A**: Natural-language conversational Q&A grounded strictly in the messages with clickable verbatim source message citations.

### The Problem It Solves
Large WhatsApp groups generate thousands of messages. Key announcements, decisions, questions, and unresolved issues get lost in casual chat. Users need to catch up quickly on what happened over a specific timeframe and ask targeted questions without manual scrolling or re-uploading files.

### Target User Flow
1. **Upload**: User uploads exported WhatsApp `.txt` file (or clicks sample demo chat).
2. **Validate & Parse**: Server parses messages ephemerally in memory, identifying metadata (participants, date bounds, total messages, group name).
3. **Configure Range**: User selects timeframe (`Last 24 Hours`, `Last 7 Days`, `Last 30 Days`, `All Time`, `Custom Range`).
4. **Filter & Chunk**: Relevant messages are isolated and chunked for hierarchical processing if context exceeds LLM limits.
5. **AI Summarization**: Multi-stage LLM pipeline produces structured JSON output.
6. **Display & Trace**: User views structured sections (Overview, Key Discussions, Decisions, Issues, Unresolved, Action Dates) with **source traceability**.
7. **Ask the Chat**: User asks natural-language questions about the chat; retriever scores & filters relevant messages; LLM provides a grounded answer with validated source citations.
8. **Privacy Cleanup**: Ephemeral raw chat data is discarded immediately after processing.

---

## 2. Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + TypeScript + React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons + `clsx` / `tailwind-merge`
- **Validation**: [Zod](https://zod.dev/) for strict schema validation across all inputs, outputs, and API routes
- **Date Handling**: `date-fns` for locale-aware date parsing and formatting
- **LLM Integration**: Multi-model architecture (Google Gemini via `@google/generative-ai` with automatic fallback: `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`)
- **Retrieval Engine**: Multi-signal relevance scoring (stopword filtering, BM25-style term frequency, sender matching, phrase bonuses, date hints, and context neighbor expansion)
- **Testing**: [Vitest](https://vitest.dev/) with 100% passing test coverage

---

## 3. Core Implementation Rules & Guidelines

### A. Code Style & Architecture
1. **Separation of Concerns**:
   - `src/lib/parser/`: WhatsApp parser, line tokenizers, format normalizers (`whatsapp-parser.ts`, `date-normalizer.ts`, `date-filter.ts`).
   - `src/lib/chunking/`: Chunking strategies, token estimators, hierarchical batching (`chat-chunker.ts`).
   - `src/lib/retrieval/`: Candidate message scoring, query tokenizers, date hint extractors (`retriever.ts`).
   - `src/lib/llm/`: LLM prompt templates, structured output schemas, provider clients, summarizer, and Q&A services (`gemini-client.ts`, `summarizer.ts`, `qa-service.ts`, `prompts.ts`, `qa-prompts.ts`).
   - `src/lib/traceability/`: Citation indexer mapping summary/Q&A items to source message IDs (`indexer.ts`).
   - `src/types/`: Strict TypeScript definitions and Zod schemas (`chat.ts`, `summary.ts`, `qa.ts`).
   - `src/components/`: Modular, reusable UI components (`UploadZone.tsx`, `ChatPreview.tsx`, `DateRangeSelector.tsx`, `SummaryViewer.tsx`, `AskTheChat.tsx`, `SourceCitationModal.tsx`, `Header.tsx`).
2. **Strict Typing & Contracts**: No `any` types. All message objects, summary sections, Q&A responses, and API routes must be backed by Zod schemas.
3. **Structured JSON Output from LLM**: 
   - **Never** request raw markdown from LLMs. Always enforce structured JSON output using schema definitions.
   - Validate LLM output against the Zod schema before returning to the client.
4. **Source Traceability & Hallucination Defense**:
   - Every parsed message receives a sequential identifier (`msg-1`, `msg-2`...).
   - Summary claims and Q&A answers must cite source message IDs (`sourceMessageIds: string[]` / `sources: [{ messageId: string }]`).
   - **Source Validation Guard**: The backend strictly verifies returned message IDs against the actual chat index. Non-existent IDs are stripped, and verbatim message contents are retrieved directly from the chat index (never trusting the LLM to invent quotes).
   - If evidence is insufficient, the system refuses to hallucinate and returns `sources: []`.
5. **Privacy First**:
   - Never log raw chat content to server logs (`console.log(rawText)` is strictly forbidden).
   - Process chats ephemerally in memory. Never store chat contents permanently in databases unless explicit user opt-in is configured.

---

## 4. What to AVOID (Anti-Patterns)

- ❌ **DO NOT dump entire unchunked chats directly into LLMs for Q&A**: Always use `retrieveRelevantMessages` to stay within token budgets and improve precision.
- ❌ **DO NOT trust LLM quotes blindly**: Always resolve citations against the actual parsed message array on the server.
- ❌ **DO NOT ask users to re-upload files to ask questions**: Pass pre-parsed `messages` arrays directly to `/api/ask`.
- ❌ **DO NOT build non-goals for MVP / Feature 2**:
  - Direct WhatsApp API / Webhook scraping / Bot integration
  - Sentiment analysis leaderboards
  - Complex permanent vector databases
  - Mobile apps / Browser extensions
- ❌ **DO NOT expose API keys to the client**: All LLM calls must reside in Next.js Server Actions or Route Handlers (`src/app/api/...`).

---

## 5. API Contracts

### `POST /api/summarize`
- **Request**: `{ rawText: string, preset?: string, startDate?: string, endDate?: string, apiKey?: string }`
- **Response**: `{ success: true, summary: ChatDigestSummary, messagesMap: Record<string, ParsedMessage>, totalAnalyzed: number, totalOriginal: number }`

### `POST /api/ask`
- **Request**: `{ question: string, messages?: ParsedMessage[], rawText?: string, dateRange?: { start?: string, end?: string }, history?: ConversationTurn[], apiKey?: string }`
- **Response**: `{ success: true, answer: string, sources: SourceMessage[], queryMetadata: { retrievedCount: number, totalChatMessages: number, durationMs: number } }`

---

## 6. Verification & Testing Commands

- Run Unit Tests: `npm test`
- Run Type Checker: `npx tsc --noEmit`
- Build Application: `npm run build`
- Dev Server: `npm run dev`
