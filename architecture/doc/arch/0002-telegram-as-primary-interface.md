# 0002 - Telegram as the Primary User Interface

Date: 2026-05-29

## Status

Accepted

## Context

The system needs a way for team members to manage tasks without requiring them to open a dedicated web app. The team evaluated several interface options:

- A dedicated mobile app (iOS / Android)
- A progressive web app (PWA)
- A Telegram bot
- A WhatsApp bot
- A CLI tool

The primary users are students and developers who already use Telegram during their workday. The deployment target is OCI, and the system must be demonstrable within a single sprint.

## Decision

Use the **Telegram Bot API** as the primary user interface for task management operations.

The web frontend (HTML/CSS/JS served by Spring Boot) is retained as a secondary interface for task visualization, but all write operations (/addtodo, /done) go through the bot.

Reasons for choosing Telegram:

1. **No install required** — users interact through the Telegram client they already have
2. **Free API** — the Telegram Bot API has no cost and no rate limit that would affect this scale
3. **TelegramBots Java library** — mature, well-documented, integrates cleanly with Spring Boot
4. **Command-based interaction** — the `/command` pattern maps directly to use cases (add task, list tasks, mark done), making the domain model and the interface naturally aligned
5. **No auth layer needed for MVP** — Telegram provides a unique numeric user ID per user, which the system uses as the identifier without building a separate login flow

## Consequences

**Positive:**
- Drastically reduces frontend development effort — no login screens, no session management, no mobile app deployment
- The bot is accessible from any device where Telegram is installed
- Telegram user IDs serve as a built-in identity mechanism
- Easy to demo in a classroom or sprint review setting

**Negative:**
- The system is dependent on Telegram's availability and API stability
- Rich UI features (file attachments, charts, complex forms) are constrained by what the Telegram message format supports
- The bot only responds to commands; it is not a free-text conversational AI
- If Telegram changes its API or bot policies, the entire interface layer is affected

## Alternatives considered

**PWA / Web-only:** Rejected as the primary interface because it requires users to navigate to a URL, authenticate, and manage sessions — more friction for a task-management tool used during active development work.

**WhatsApp Business API:** Rejected due to cost (Meta charges per conversation) and the approval process required to obtain API access.

**CLI tool:** Considered as a complement but not as the primary interface, since it would only work where the CLI is installed and would add a distribution problem.
