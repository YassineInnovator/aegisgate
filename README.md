# AegisGate 🛡️

**Use AI at work without leaking your data or burning your budget.**

AegisGate sits between your team and AI models. Every request gets checked first:
- 🔒 **Private data** (emails, IBANs, phone numbers, internal info) stays on a local AI running on your own machine. It never touches the cloud.
- ☁️ **Complex questions with nothing sensitive** go to powerful cloud AIs (Claude, Groq, Gemini). If one is down, AegisGate switches to another automatically.
- 📚 **Your documents**: upload internal docs and ask questions about them.
- 📊 **Full visibility**: a dashboard shows which AI answered, how fast, and what it cost.

## Why I'm building this
Companies want AI, but they can't risk sending customer data to the internet, and cloud AI costs add up fast. AegisGate solves both. It's also my flagship project, built step by step to show production-level skills in full-stack and AI engineering.

## Progress
- [ ] **Phase 1**: Talking to AI models safely (guardrails, prompt-injection defense)
- [ ] **Phase 2**: Smart routing: local vs. cloud, privacy lock, automatic fallback
- [ ] **Phase 3**: Document search (RAG with vector embeddings)
- [ ] **Phase 4**: MCP server so other AI tools can plug in
- [ ] **Phase 5**: Web API + React dashboard
- [ ] **Phase 6**: Quality tests, Docker, CI/CD

## Built with
TypeScript · Node.js · React · Supabase (PostgreSQL + pgvector) · Ollama · Anthropic SDK · MCP · Vitest · Docker

**Runs for €0**: local models plus free tiers only.
