# AGENT INSTRUCTIONS & PROJECT GUIDELINES: ChatDigest

> **Product**: ChatDigest — WhatsApp Group Chat Summarizer  
> **Status**: Setup Complete / Ready for Feature Implementation  
> **Document Reference**: [`SRD.md`](file:///c:/Users/Vikram%20Kumar/Desktop/Projects/ChatDigest/SRD.md)

---

## 1. Project Overview & Core Mission

**ChatDigest** is an AI-powered web application that processes exported WhatsApp group chats (`.txt` files) and produces structured, accurate, and verifiable summaries for a selected date range.

### The Problem It Solves
Large WhatsApp groups generate thousands of messages. Key announcements, decisions, questions, and unresolved issues get lost in casual chat. Users need to quickly catch up on what happened over a specific timeframe (e.g., last 24h, last 7 days, or custom date range) without manual scrolling.

### Target User Flow
1. **Upload**: User uploads exported WhatsApp `.txt` file.
2. **Validate & Parse**: Server parses messages, identifies metadata (participant count, date bounds, total messages, group name).
3. **Configure Range**: User selects timeframe (e.g., last 24h, last 7 days, custom range).
4. **Filter & Chunk**: Relevant messages are isolated and chunked for hierarchical processing if context exceeds LLM limits.
5. **AI Summarization**: Multi-stage LLM pipeline produces structured JSON output.
6. **Display & Trace**: User views structured sections (Overview, Decisions, Discussions, Issues, Unresolved, Action Dates) with **source traceability** (click to see exact original messages).
7. **Privacy Cleanup**: Ephemeral raw chat data is discarded immediately after processing.

---

## 2. Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) + TypeScript + React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons + `clsx` / `tailwind-merge`
- **Validation**: [Zod](https://zod.dev/) for strict schema validation (LLM output contracts, upload contracts)
- **Date Handling**: `date-fns` for locale-aware date parsing and formatting
- **LLM Integration**: Multi-provider architecture (Google Gemini via `@google/genai`, OpenAI optional fallback)
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration testing (parser, chunker, filters)

---

## 3. Core Implementation Rules & Guidelines

### A. Code Style & Architecture
1. **Separation of Concerns**: Keep business logic out of UI components:
   - `src/lib/parser/`: WhatsApp parser, line tokenizers, format normalizers.
   - `src/lib/chunking/`: Chunking strategies, token estimators, hierarchical batching.
   - `src/lib/llm/`: LLM prompt templates, structured output schemas, provider clients.
   - `src/lib/traceability/`: Citation indexer mapping summary items to source message IDs.
   - `src/types/`: Shared TypeScript definitions and Zod schemas.
   - `src/components/`: Modular, reusable UI components (Upload, SummaryView, SourceModal, etc.).
2. **Strict Typing**: No `any` types. All message objects, summary sections, and API responses must be strictly typed and backed by Zod schemas.
3. **Structured JSON Output from LLM**: 
   - **Never** request raw markdown from LLMs. Always enforce structured JSON output using schema definitions.
   - Validate LLM output against the Zod schema before sending it to the client.
4. **Robust WhatsApp Parsing**:
   - WhatsApp export formats vary across platforms (iOS vs Android) and regional locales (e.g., `[DD/MM/YYYY, HH:mm:ss]`, `MM/DD/YY, h:mm a - Sender:`, `DD.MM.YY, HH:mm - Sender:`).
   - Support multi-line messages (append lines until a new timestamp header is matched).
   - Handle system messages (e.g., "Messages and calls are end-to-end encrypted", "User joined", "User left").
   - Filter or mark media omission placeholders (`<Media omitted>`, `image omitted`, etc.).
   - Standardize all internal message timestamps into ISO 8601 strings.
5. **Source Traceability (Anti-Hallucination)**:
   - Every parsed message must receive a deterministic or sequential identifier (e.g., `msg_0001` or hash).
   - Summary claims (decisions, dates, unresolved topics) must reference source message IDs (`sourceMessageIds: string[]`).
   - The UI must allow users to click and inspect source messages for any claim.
6. **Privacy First**:
   - Never log raw chat content to server logs (`console.log(rawText)` is strictly forbidden).
   - Process chats ephemerally in memory or temporary files that are deleted immediately upon completion.
   - Never store chat contents permanently in databases unless explicit user opt-in is configured.

---

## 4. What to AVOID (Anti-Patterns)

- ❌ **DO NOT start building features out of order**: Follow the pipeline order (Parser -> Chunking -> LLM Schema -> UI -> Traceability).
- ❌ **DO NOT rely on single regex for parsing**: WhatsApp exports have at least 6 common format variations. Test against multiple fixtures.
- ❌ **DO NOT dump entire unchunked 50,000-message chats directly into LLMs**: Always filter by date range first, then apply chunking/hierarchical synthesis.
- ❌ **DO NOT implement Non-Goals for the MVP**:
  - Direct WhatsApp API / Webhook scraping / Bot integration
  - Sentiment analysis leaderboards
  - Complex multi-chat RAG or permanent vector databases
  - Mobile apps / Browser extensions
- ❌ **DO NOT expose API keys to the client**: All LLM calls must reside in Next.js Server Actions or Route Handlers (`src/app/api/...`).

---

## 5. Summary Schema Definition (Contract)

The final summary returned to the frontend must conform to this schema:

```typescript
export interface ChatMessage {
  id: string;
  timestamp: string; // ISO 8601
  sender: string;
  content: string;
  isSystem?: boolean;
}

export interface SummaryDecision {
  text: string;
  sourceMessageIds: string[];
}

export interface SummaryIssue {
  topic: string;
  details: string;
  status: "resolved" | "unresolved" | "in_discussion";
  sourceMessageIds: string[];
}

export interface SummaryEventDate {
  date: string; // Event or deadline date
  description: string;
  sourceMessageIds: string[];
}

export interface ChatDigestSummary {
  metadata: {
    groupName?: string;
    dateRange: { start: string; end: string };
    totalMessagesAnalyzed: number;
    participantCount: number;
  };
  overview: string; // 2-4 sentences
  keyDiscussions: Array<{
    topic: string;
    summary: string;
    sourceMessageIds: string[];
  }>;
  decisionsAndAnnouncements: SummaryDecision[];
  issuesAndQuestions: SummaryIssue[];
  unresolvedTopics: string[];
  importantDatesAndActions: SummaryEventDate[];
}
```

---

## 6. Phased Implementation Roadmap

When implementing features in subsequent steps, follow this exact sequence:

1. **Phase 1: WhatsApp Parser & Test Suite**
   - Implement regex parsers covering iOS & Android export formats (12h, 24h, varying date formats).
   - Handle multiline messages, system messages, media omitted indicators.
   - Comprehensive test suite with sample test chats in `tests/parser.test.ts`.

2. **Phase 2: Date Filtering & Metadata Calculation**
   - Fast date-range filtering (`date-fns`).
   - Group name extraction, active participants count, date bounding.

3. **Phase 3: Hierarchical Chunking Pipeline**
   - Token & message counter to split large conversations into ~400–600 message chunks with overlap.
   - Map-Reduce / Hierarchical summarizer design for large datasets.

4. **Phase 4: LLM Service & Structured Output**
   - Provider abstraction (Gemini 2.5/2.0 Flash / OpenAI).
   - Structured JSON prompt engineering + Zod output validation.

5. **Phase 5: Source Traceability Engine**
   - Cross-referencing message citations to original parsed messages.

6. **Phase 6: Frontend UI / UX**
   - File drag-and-drop upload zone.
   - Parsing preview & metadata cards.
   - Date range selector (presets + custom calendar).
   - Structured Summary Viewer with collapsible sections and Source Citations drawer.

7. **Phase 7: Privacy, Error Handling & End-to-End Verification**
   - Granular error boundaries & validation toasts.
   - Temporary file cleanup routines and security checks.

---

## 7. Verification & Testing Commands

- Run Unit Tests: `npm test`
- Run Linter: `npm run lint`
- Build Application: `npm run build`
- Dev Server: `npm run dev`

