# Feature: Ask the Chat

## 1. Objective

Add an **"Ask the Chat"** feature to the existing WhatsApp Group Intelligence application.

The feature allows users to ask natural-language questions about an uploaded WhatsApp conversation and receive an AI-generated answer grounded strictly in the messages from that conversation.

The most important requirement is **source traceability**: every factual claim in the answer should be supported by one or more original WhatsApp messages, which the user can expand and inspect.

This feature should work on the chat that the user has already uploaded and processed. **Do not require the user to upload the chat again to ask multiple questions.**

---

# 2. Example User Experience

After a user uploads a WhatsApp export and generates a summary, the summary page should contain an "Ask the Chat" section.

Example:

```text
┌──────────────────────────────────────────────────┐
│ Ask the Chat                                     │
│                                                  │
│ Ask anything about this conversation...          │
│                                                  │
│ [ What was decided about parking?            ]   │
│                                      [Ask]       │
└──────────────────────────────────────────────────┘
```

The user could ask:

* "What was decided about parking?"
* "Why was the meeting postponed?"
* "Did anyone volunteer for the event?"
* "What did the admin say about water supply?"
* "What issues are still unresolved?"
* "When is the next residents meeting?"
* "Who proposed the new parking system?"

The answer should look like:

```text
Answer

The residents agreed to introduce parking stickers
starting September 10. The admin announced the
change on September 5, and several residents
acknowledged the decision.

Sources
────────────────────────────────────
Sep 5, 6:42 PM — Admin
"Parking stickers will be mandatory from September 10."

Sep 5, 7:03 PM — Rahul
"Okay, so the new rule starts from the 10th?"
────────────────────────────────────
```

The source messages should be clickable/expandable.

---

# 3. Core Functional Requirements

## FR-01 — Ask a Question

The user must be able to enter a natural-language question about the currently selected/uploaded chat.

The question should be sent to the backend through a dedicated API endpoint.

Example:

```http
POST /api/chats/{chatId}/ask
```

Request:

```json
{
  "question": "What was decided about parking?"
}
```

---

# 4. FR-02 — Use the Existing Chat Data

The feature must use the messages that were already parsed from the uploaded WhatsApp export.

Do NOT:

* ask the user to upload the file again
* send the original `.txt` file directly to the LLM
* create a second independent parser
* duplicate the existing chat-processing pipeline

Reuse the application's existing:

* chat/message model
* parser
* date filtering
* source/message IDs
* storage layer
* LLM infrastructure
* validation infrastructure

The new feature should integrate into the existing architecture rather than creating a parallel implementation.

---

# 5. FR-03 — Retrieve Relevant Messages

Do not send the entire conversation to the LLM for every question.

The system should first retrieve the messages that are most relevant to the user's question.

Initial implementation may use:

* PostgreSQL full-text search
* keyword matching
* PostgreSQL `tsvector`
* existing topic/group information

If the project already has embeddings/vector search, reuse it.

If not, **do not introduce a vector database solely for this feature unless there is a clear architectural need.**

The retrieval pipeline should be abstracted so that semantic/vector retrieval can be added later.

Conceptually:

```text
User Question
      ↓
Query Processing
      ↓
Retrieve Relevant Messages
      ↓
Rank / Limit Results
      ↓
LLM
      ↓
Answer + Source IDs
```

---

# 6. FR-04 — Source-Grounded Answers

The LLM must answer using only the retrieved WhatsApp messages.

The model must NOT rely on external knowledge to answer questions about the conversation.

For every factual answer, the model should return references to the message IDs that support the answer.

Example LLM output:

```json
{
  "answer": "The residents agreed to make parking stickers mandatory from September 10.",
  "sources": [
    {
      "messageId": "msg_18342"
    },
    {
      "messageId": "msg_18351"
    }
  ]
}
```

The backend must validate this response using Zod.

---

# 7. FR-05 — Source Validation

Never trust source IDs returned by the LLM blindly.

The backend must verify that:

1. The referenced message exists.
2. The message belongs to the current chat.
3. The message was included in or is valid for the current retrieval context.

Invalid source IDs must be removed or cause the response to be rejected/reprocessed.

The final API response should contain the actual message information from the database rather than allowing the LLM to invent message content.

For example:

```json
{
  "answer": "The parking sticker policy starts on September 10.",
  "sources": [
    {
      "id": "msg_18342",
      "timestamp": "2026-09-05T18:42:00",
      "sender": "Admin",
      "content": "Parking stickers will be mandatory from September 10."
    }
  ]
}
```

The message content displayed to the user must come from the stored chat data, not from the LLM.

---

# 8. FR-06 — No Answer / Insufficient Evidence

If the retrieved messages do not contain enough information to answer the question, the system must NOT hallucinate an answer.

Return something such as:

```text
I couldn't find enough information in this conversation
to answer that confidently.
```

The response may optionally explain what information was found.

Example:

```json
{
  "answer": "I couldn't find enough information in this conversation to determine when the lift will be repaired.",
  "sources": []
}
```

Do not fabricate sources.

---

# 9. FR-07 — Date-Aware Questions

The system should support questions containing time references.

Examples:

* "What happened yesterday?"
* "What was decided this week?"
* "What did people discuss on September 5?"
* "What changed between September 1 and September 5?"

The system should extract date constraints where practical and restrict retrieval accordingly.

Example:

```text
Question:
"What happened regarding parking this week?"

      ↓

Date filter:
Current selected week

      ↓

Topic retrieval:
Parking-related messages

      ↓

LLM
```

This should reuse the existing date filtering functionality.

---

# 10. FR-08 — Conversation Context

The user should be able to ask multiple questions in the same session.

Example:

```text
User:
What was decided about parking?

AI:
Parking stickers will be mandatory from September 10.

User:
Who proposed it?

AI:
The proposal was initially made by Rahul...

User:
Was everyone okay with it?

AI:
Most participants who responded appeared to support it,
although two residents raised concerns...
```

For MVP, conversation history may be limited to the current session.

The system should avoid sending the entire previous conversation to the LLM unnecessarily.

---

# 11. FR-09 — Suggested Questions

The Ask the Chat interface should display a few suggested questions to help users discover the feature.

Examples:

```text
Suggested questions

• What were the main decisions?
• What issues are still unresolved?
• What happened this week?
• What upcoming events were mentioned?
```

Clicking a suggestion should populate/submit the question.

---

# 12. FR-10 — Loading and Error States

The UI should clearly communicate processing states.

Examples:

```text
Searching the conversation...
```

then:

```text
Analyzing relevant messages...
```

Errors should be user-friendly.

Examples:

```text
Something went wrong while generating the answer.
Please try again.
```

Do not expose raw API errors, stack traces, or provider-specific errors to users.

---

# 13. API Requirements

Create a dedicated endpoint:

```http
POST /api/chats/{chatId}/ask
```

Request:

```json
{
  "question": "What was decided about parking?"
}
```

Optional:

```json
{
  "question": "What was decided about parking?",
  "dateRange": {
    "start": "2026-09-01",
    "end": "2026-09-06"
  }
}
```

Response:

```json
{
  "answer": "Residents agreed to make parking stickers mandatory from September 10.",
  "sources": [
    {
      "id": "msg_18342",
      "timestamp": "2026-09-05T18:42:00",
      "sender": "Admin",
      "content": "Parking stickers will be mandatory from September 10."
    }
  ]
}
```

Use Zod schemas for both request and response validation.

---

# 14. LLM Output Contract

The LLM should be instructed to return structured JSON only.

Example schema:

```typescript
const AskChatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(
    z.object({
      messageId: z.string()
    })
  )
});
```

The LLM should follow rules such as:

```text
You are answering questions about a WhatsApp group conversation.

Use ONLY the provided conversation messages.

Do not use outside knowledge.

Do not invent facts, events, people, decisions, or dates.

Every factual claim must be supported by one or more
provided message IDs.

Return the IDs of the messages that directly support
your answer.

If the conversation does not contain enough information
to answer the question, say that there is insufficient
information and return an empty sources array.

Never invent a message ID.
```

---

# 15. Architecture

Follow this architecture:

```text
                    User
                      │
                      ▼
                Ask the Chat UI
                      │
                      ▼
              POST /api/chats/:id/ask
                      │
                      ▼
                Ask Chat Service
                      │
              ┌───────┴────────┐
              ▼                ▼
       Query Processing    Chat Metadata
              │
              ▼
       Message Retrieval
              │
              ▼
        Relevant Messages
              │
              ▼
        LLM Provider
              │
              ▼
     Structured JSON Response
              │
              ▼
       Zod Validation
              │
              ▼
      Source ID Validation
              │
              ▼
       Fetch Source Messages
              │
              ▼
            Response
              │
              ▼
              UI
```

---

# 16. Privacy Requirements

WhatsApp conversations may contain sensitive information.

The feature must:

* Never log the user's question together with the complete chat contents.
* Never log raw WhatsApp messages unnecessarily.
* Never expose messages belonging to another chat/user.
* Ensure `chatId` authorization before retrieving messages.
* Keep LLM API keys server-side.
* Follow the existing application's data-retention policy.

---

# 17. Performance Requirements

The system should retrieve only the necessary messages rather than loading the entire conversation into the LLM context.

Target:

```text
Question
 ↓
Retrieval: < 1–2 seconds
 ↓
LLM: dependent on provider
 ↓
Total target: < 10 seconds for normal queries
```

The implementation should also enforce a maximum number/token budget for retrieved messages.

---

# 18. Testing Requirements

Add automated tests for:

### Retrieval

* Relevant messages are retrieved.
* Irrelevant messages are excluded where possible.
* Date filtering works.
* Empty retrieval is handled.

### LLM response validation

* Valid structured response is accepted.
* Malformed JSON is rejected.
* Invalid message IDs are rejected.
* Empty source arrays are allowed.

### Security

* User cannot query another user's chat.
* User cannot access another chat's messages through a fabricated `chatId`.

### UI

* Question submission works.
* Loading state appears.
* Sources are displayed.
* Source messages expand correctly.
* Errors are displayed properly.

---

# 19. Implementation Constraints

Do not unnecessarily rewrite existing functionality.

Before implementing:

1. Inspect the existing project structure.
2. Identify how chats and messages are currently stored.
3. Identify the existing summary-generation service.
4. Identify the existing LLM provider abstraction.
5. Identify how source messages are currently represented.
6. Reuse existing utilities and schemas where possible.

Do not create duplicate parser, LLM, database, or source models.

Keep the implementation modular so that retrieval can later evolve from keyword/full-text search to embeddings/vector search without rewriting the entire Ask Chat feature.

---

# 20. Acceptance Criteria

The feature is considered complete when:

* A user can open a previously processed chat.
* The user can enter a natural-language question.
* The application retrieves relevant messages.
* The LLM generates an answer using only those messages.
* The answer contains valid source references.
* The UI displays the original supporting messages.
* Clicking/expanding a source shows the actual original message.
* The system refuses to hallucinate when evidence is insufficient.
* Users can ask multiple questions without re-uploading the chat.
* Date-specific questions work where applicable.
* Unauthorized users cannot access another user's conversation.
* Automated tests cover retrieval, validation, source integrity, and authorization.

---

# 21. Future Extensions — Do Not Implement Now

Design the feature so the following can be added later, but do not implement them as part of this task:

* Vector embeddings / semantic search
* pgvector
* Hybrid keyword + semantic retrieval
* Streaming answers
* Conversation memory across sessions
* Personalized "catch me up"
* Automatic daily/weekly summaries
* Multiple WhatsApp groups
* Voice questions
* WhatsApp integration
* Advanced analytics
* Sentiment analysis

The goal of this implementation is to deliver a **reliable, source-grounded Ask the Chat experience**, not to build the entire future roadmap.
