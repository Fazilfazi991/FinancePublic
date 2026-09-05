# Ask ZeroDebt architecture

Ask ZeroDebt is an authenticated, read-only financial copilot. Browser code calls `/api/ai/chat`; only the server calls the configured provider. `OPENAI_API_KEY` must never use a `NEXT_PUBLIC_` prefix. The default configurable model is `gpt-5.6-luna` through `AI_MODEL`.

The context builder queries data through the signed-in Supabase session and explicitly scopes every finance table to the authenticated user. It removes internal IDs, email, auth data, and Telegram identifiers before provider use. Transaction descriptions are shortened and marked as untrusted data. Deterministic code calculates Freedom Number, live available balance, payoff power, category totals, Avalanche/Snowball payoff results, and extra-payment simulations. The provider only interprets that snapshot.

Conversation history is stored in `ai_conversations` and `ai_messages`, protected by ownership RLS. Users can start, view, and delete chats. Deleting a conversation cascades to its messages. No system prompts are stored. Retention lasts until the user deletes a chat or account; account deletion cascades all AI records.

`ai_usage` tracks the monthly request count and aggregate token usage without prompt contents. Defaults are 5 questions/month for free and 100 for future premium access. Input is capped at 800 characters, output at 700 tokens, provider calls time out after 15 seconds, rapid requests are throttled, and errors are sanitized.

V1 exposes no write tools and cannot modify finance records. Future write actions must be separate, narrowly scoped server functions with a visible confirmation step, idempotency key, authorization re-check, and audit record before mutation.
