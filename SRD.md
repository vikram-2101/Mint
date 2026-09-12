# Software Requirements Document (SRD)

## WhatsApp Group Chat Summarizer

**Document Version:** 1.0
**Status:** MVP Specification
**Target Platform:** Web Application
**Primary Users:** Individuals who want to quickly understand activity in large WhatsApp group chats

---

## 1. Product Overview

### 1.1 Purpose

The WhatsApp Group Chat Summarizer is a web application that allows users to upload an exported WhatsApp group chat and generate an AI-powered summary for a user-defined time period.

The application will process the exported chat, identify relevant conversations, decisions, announcements, questions, and unresolved topics, and present them in a concise and structured format.

The primary goal is to eliminate the need to manually scroll through hundreds or thousands of WhatsApp messages to understand what happened in a group during a particular period.

### 1.2 Problem Statement

Large WhatsApp groups can generate hundreds or thousands of messages over a short period of time. Important information such as announcements, decisions, requests, and unresolved issues can easily get buried in casual conversations.

Users often need answers to questions such as:

* What happened in this group this week?
* Were any important decisions made?
* What issues were raised?
* Were those issues resolved?
* Are there any upcoming events or deadlines?
* What are the most important things I should know?

Currently, answering these questions requires manually reading through the conversation.

### 1.3 Proposed Solution

The application will allow users to:

1. Export a WhatsApp group chat.
2. Upload the exported chat file.
3. Select a date/time range.
4. Process the relevant messages.
5. Generate an AI-powered summary.
6. View the summary in a structured interface.

---

# 2. Goals

### Primary Goals

The MVP should:

* Accurately parse WhatsApp chat exports.
* Allow users to select a specific time period.
* Generate concise and useful summaries.
* Highlight important information rather than simply shortening the conversation.
* Clearly distinguish between facts stated in the conversation and AI-generated interpretations.
* Handle large chat exports efficiently.
* Protect uploaded chat data and user privacy.

### Secondary Goals

The system should be designed so that future versions can support:

* Multiple chat uploads.
* Search and question answering.
* Topic-based summaries.
* Weekly/daily digests.
* Conversation analytics.
* User-specific notifications.
* RAG-based chat querying.

---

# 3. Non-Goals for MVP

The following should **not** be part of the initial MVP:

* Direct integration with WhatsApp.
* Automatically reading WhatsApp messages.
* WhatsApp bot integration.
* Real-time monitoring of WhatsApp groups.
* Sentiment analysis.
* Advanced participant analytics.
* Semantic search across the entire chat.
* RAG/chat-with-your-chat functionality.
* Scheduled summaries.
* Mobile applications.
* Complex dashboards.

These features can be evaluated after validating the core product.

---

# 4. Target User Flow

```text
User
 │
 ▼
Landing Page
 │
 ▼
Upload WhatsApp Export
 │
 ▼
Validate & Parse File
 │
 ▼
Preview Chat Information
 │
 ▼
Select Date Range
 │
 ▼
Generate Summary
 │
 ▼
Processing
 │
 ▼
Summary
```

Example:

```text
Upload:
Residents Group.txt

Messages:
18,432

Date Range:
01 Sep 2026 → 06 Sep 2026

                [Generate Summary]
```

---

# 5. MVP Functional Requirements

## FR-01 — Chat Upload

The system shall allow users to upload a WhatsApp chat export.

### Supported format

Initially:

* `.txt`

Optional later:

* `.zip` containing media/text export

The MVP should **not process media files**.

### Validation

The system should:

* Verify that the uploaded file is a supported format.
* Reject unsupported files.
* Enforce a maximum file size.
* Detect whether the file resembles a WhatsApp chat export.
* Display a meaningful error when parsing fails.

---

# 6. FR-02 — WhatsApp Chat Parser

The backend shall parse the exported WhatsApp text file into structured messages.

Each message should ideally contain:

```json
{
  "timestamp": "2026-09-05T20:14:00",
  "sender": "Rahul",
  "content": "Does anyone know when the lift will be repaired?"
}
```

The parser should account for:

* Different date formats.
* Different time formats.
* Multi-line messages.
* Messages without identifiable senders.
* System messages.
* Deleted messages.
* Media placeholders.
* Group notifications.

The parser should normalize timestamps internally to a consistent format.

---

# 7. FR-03 — Chat Metadata

After parsing, the system should calculate basic metadata:

```text
Group:
Residents Group

Date Range:
01 Aug 2026 – 06 Sep 2026

Total Messages:
18,432

Participants:
127
```

For MVP, this information is primarily for user feedback and validation.

---

# 8. FR-04 — Time-Range Selection

Users shall be able to select the period they want summarized.

Supported options:

* Last 24 hours
* Last 7 days
* Last 30 days
* Custom date range

The backend should filter messages **before sending them to the LLM**.

Example:

```text
Chat:
100,000 messages

Selected period:
01 Sep → 05 Sep

Relevant messages:
2,341
```

Only the relevant messages should enter the summarization pipeline.

---

# 9. FR-05 — AI Summarization

The system shall generate a structured summary from the selected messages.

The MVP summary should contain:

### Overview

A short 2–4 sentence description of the major activity.

### Key Discussions

The major topics discussed during the selected period.

Example:

```text
1. Parking allocation
2. Water supply
3. Security concerns
```

### Decisions & Announcements

Important decisions, announcements, or confirmed information.

### Issues / Questions

Important questions or problems raised by participants.

### Unresolved Topics

Issues that appear to remain unresolved based on the conversation.

### Important Dates / Actions

Upcoming dates, deadlines, meetings, events, or requested actions mentioned in the chat.

---

# 10. FR-06 — Long Conversation Processing

The system shall support chats that exceed the context window of the selected LLM.

The summarization pipeline should use hierarchical summarization.

```text
Messages
    ↓
Filter by date
    ↓
Chunk messages
    ↓
Summarize each chunk
    ↓
Combine chunk summaries
    ↓
Generate final summary
```

Example:

```text
2,500 messages

        ↓

Chunk 1 → Summary
Chunk 2 → Summary
Chunk 3 → Summary
Chunk 4 → Summary

        ↓

Final synthesis

        ↓

User-facing summary
```

This should be implemented as part of the MVP because **large group chats are the main reason the product exists**.

---

# 11. FR-07 — Summary Interface

The summary should be displayed in a clean, readable interface.

Suggested structure:

```text
┌─────────────────────────────────────┐
│ Residents Group                     │
│ Sep 1 – Sep 5                       │
├─────────────────────────────────────┤
│                                     │
│ Overview                            │
│ ----------------------------------  │
│ Residents mainly discussed...       │
│                                     │
│ Key Discussions                     │
│ ----------------------------------  │
│ • Parking allocation                │
│ • Water supply                      │
│ • Security                          │
│                                     │
│ Decisions & Announcements            │
│ ----------------------------------  │
│ • Parking stickers required...      │
│                                     │
│ Unresolved                          │
│ ----------------------------------  │
│ • Visitor parking policy...         │
│                                     │
│ Important Dates                     │
│ ----------------------------------  │
│ • Sep 10 — parking policy begins    │
│                                     │
└─────────────────────────────────────┘
```

---

# 12. FR-08 — Source Traceability

This is something I'd **strongly recommend adding even to the MVP**.

AI summaries can hallucinate.

Therefore, important summary items should ideally be traceable back to the original messages.

For example:

> **Parking stickers will be mandatory from September 10.**

Then:

> View source messages

which expands to:

```text
[05 Sep, 18:42] Admin:
Parking stickers will be mandatory from September 10.

[05 Sep, 18:45] Rahul:
Okay, noted.
```

You don't necessarily need sophisticated retrieval for this.

The summarization pipeline can associate important claims with message IDs/chunks.

This will make the product **far more trustworthy**.

---

# 13. FR-09 — Privacy

Because WhatsApp conversations can contain sensitive personal information, privacy should be treated as a core requirement.

The MVP should:

* Use HTTPS.
* Avoid logging raw chat contents.
* Encrypt stored files if files are persisted.
* Delete uploaded chats after a defined retention period.
* Avoid storing chat content unnecessarily.
* Clearly tell users how their uploaded data is processed.

Ideally, the architecture should support:

```text
Upload
   ↓
Process
   ↓
Generate summary
   ↓
Delete raw chat
```

rather than permanently storing everyone's WhatsApp history.

---

# 14. FR-10 — Error Handling

The application should provide meaningful errors for:

* Invalid file.
* Unsupported format.
* Empty chat.
* Invalid WhatsApp export.
* No messages in selected date range.
* LLM/API failure.
* Processing timeout.
* File exceeding size limit.

Example:

> **No messages found for this period.**
> Try selecting a different date range.

---

# 15. Non-Functional Requirements

## Performance

For a normal chat export, the summary should ideally be generated within **30–60 seconds**, depending on file size and LLM processing.

The architecture should avoid loading extremely large files entirely into memory.

## Scalability

The backend should support processing multiple summarization requests concurrently.

For larger scale, processing should eventually move to:

```text
API
 ↓
Queue
 ↓
Worker
 ↓
LLM
 ↓
Database
```

For the MVP, this can initially be simpler if necessary.

## Reliability

Failed LLM requests should be retried where appropriate.

Partial processing failures should not corrupt the original uploaded file.

## Security

* Authentication should be considered if chat data is persisted.
* API keys must remain server-side.
* Uploaded files must not be publicly accessible.
* Raw chat content should not appear in application logs.

---

# 16. Suggested Technical Architecture

Given your existing stack, I'd build the MVP roughly like this:

```text
                  ┌──────────────┐
                  │   Frontend   │
                  │ React/Next.js│
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Backend    │
                  │ Node.js/TS   │
                  └──────┬───────┘
                         │
             ┌───────────┼────────────┐
             ▼           ▼            ▼
        File Parser   PostgreSQL     LLM
             │                        │
             ▼                        ▼
       Structured Chat         Chunk Summaries
                                      │
                                      ▼
                               Final Summary
```

### Suggested stack

**Frontend**

* React / Next.js
* Tailwind CSS

**Backend**

* Node.js
* TypeScript
* Fastify/Express/NestJS — whichever you're comfortable with

**Database**

* PostgreSQL

**File processing**

* Node.js streaming/file APIs

**LLM**

* OpenAI/Claude/Gemini API

**Optional**

* Redis
* BullMQ

I'd initially avoid adding Redis unless the processing workflow actually needs background jobs.

---

# 17. Data Model

A simple MVP schema could be:

### `users`

```text
id
email
created_at
```

### `chats`

```text
id
user_id
name
message_count
participant_count
start_date
end_date
created_at
expires_at
```

### `messages`

```text
id
chat_id
timestamp
sender
content
```

### `summaries`

```text
id
chat_id
start_date
end_date
overview
key_discussions
decisions
issues
unresolved_topics
important_dates
created_at
```

However, if you're implementing the **privacy-first MVP**, you could avoid permanently storing `messages` altogether.

---

# 18. MVP Scope

I'd define your actual MVP as exactly these **7 features**:

### Must Have

1. **WhatsApp `.txt` upload**
2. **Robust chat parser**
3. **Date-range filtering**
4. **LLM summarization**
5. **Structured summary**
6. **Long-chat chunking**
7. **Basic privacy/data deletion**

### Nice but still reasonable for MVP

8. Source messages / traceability
9. Chat metadata
10. Download/share summary

### Don't build yet

❌ WhatsApp API integration
❌ RAG
❌ Chat with your WhatsApp
❌ Sentiment analysis
❌ Participant leaderboard
❌ Multiple chat aggregation
❌ Scheduled summaries
❌ Mobile app
❌ Browser extension

---

# 19. Example MVP

A user uploads:

```text
Apartment Residents.txt
```

The application detects:

```text
18,423 messages
127 participants
01 Aug 2026 → 06 Sep 2026
```

User selects:

```text
01 Sep → 06 Sep
```

The backend finds:

```text
2,341 messages
```

Pipeline:

```text
2,341 messages
       ↓
Chunk into ~500-message groups
       ↓
5 chunk summaries
       ↓
LLM synthesis
       ↓
Structured final summary
```

Result:

```text
WEEKLY SUMMARY

Overview
Residents primarily discussed parking,
maintenance and security issues.

KEY DISCUSSIONS

• Parking allocation
• Lift maintenance
• Visitor parking

DECISIONS

• New parking stickers will be issued
  from September 10.

ISSUES

• Several residents reported water
  supply interruptions.

UNRESOLVED

• Visitor parking policy remains
  under discussion.

IMPORTANT DATES

• September 10 — New parking policy
```

That's a **complete, demonstrable MVP**.

---

## 20. Success Metrics

For the first version, I'd measure:

**Usability**

* User can upload a chat successfully.
* User can select a date range.
* User can generate a summary without assistance.

**Quality**

* Summary captures major topics.
* Decisions are correctly represented.
* Important dates are preserved.
* Hallucination rate is minimized.

**Performance**

* Typical chat processed within 30–60 seconds.
* Large exports don't crash the application.

**Product validation**

The most important question:

> **"After reading the summary, does the user feel they understand what happened in the group without reading the original messages?"**

If the answer is consistently **yes**, you have a product worth expanding.

---

### My recommendation for your actual build

Don't start by building the UI.

I'd build it in this order:

```text
1. WhatsApp parser
       ↓
2. Date filtering
       ↓
3. Chunking strategy
       ↓
4. LLM summarization
       ↓
5. Summary JSON schema
       ↓
6. API
       ↓
7. Frontend
       ↓
8. Privacy + cleanup
       ↓
9. Source traceability
```

And one particularly important engineering decision: **make the LLM return structured JSON rather than Markdown.** Your backend can validate that JSON and your frontend can render it however you want. That will make the application substantially more robust and gives you a good opportunity to demonstrate proper backend/LLM engineering rather than simply wrapping an LLM call.
