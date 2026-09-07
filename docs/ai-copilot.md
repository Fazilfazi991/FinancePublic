# Ask ZeroDebt architecture

Ask ZeroDebt is an authenticated financial copilot and confirmation-based entry interface. Its deterministic parser and insight engine run without an AI provider. Set `AI_ASSISTANT_ENABLED=false` to explicitly disable AI; AI is also unavailable when `OPENAI_API_KEY` is absent. Browser code calls `/api/ai/chat` only for questions the deterministic engine does not recognize, and only the server calls the configured provider. `OPENAI_API_KEY` must never use a `NEXT_PUBLIC_` prefix. The default configurable model is `gpt-5.6-luna` through `AI_MODEL`.

The context builder queries data through the signed-in Supabase session and explicitly scopes every finance table to the authenticated user. It removes internal IDs, email, auth data, and Telegram identifiers before provider use. Transaction descriptions are shortened and marked as untrusted data. Deterministic code calculates Freedom Number, live available balance, payoff power, category totals, Avalanche/Snowball payoff results, and extra-payment simulations. The provider only interprets that snapshot.

Conversation history is stored in `ai_conversations` and `ai_messages`, protected by ownership RLS. Users can start, view, and delete chats. Deleting a conversation cascades to its messages. No system prompts are stored. Retention lasts until the user deletes a chat or account; account deletion cascades all AI records.

`ai_usage` tracks the monthly request count and aggregate token usage without prompt contents. Defaults are 5 questions/month for free and 100 for future premium access. Input is capped at 800 characters, output at 700 tokens, provider calls time out after 15 seconds, rapid requests are throttled, and errors are sanitized.

Financial writes never pass through the AI provider. The client parser creates an editable structured draft for expenses, income, debts, goals, and debt payments. A separate confirm action calls the existing authenticated route; those routes scope records to the current user and debt payments use the existing transactional RPC. Transaction writes carry an idempotency key. Free text alone never mutates a record.
