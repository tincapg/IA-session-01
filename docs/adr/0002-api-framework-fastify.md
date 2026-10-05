# 0002 — API framework: Fastify

- **Status:** accepted
- **Date:** 2026-09-13

## Context

The API starts agent runs, streams their events, persists results and, from Session 2, drives Loom's workflow and review actions. It needs request validation from shared contracts, structured logging, clean shutdown (the Copilot runtime is a child process that must be stopped) and a plugin model that lets each session add routes without touching the rest.

## Options

1. **Fastify 5**
2. Hono
3. Express 5

## Decision

Use **Fastify 5**.

- Request and response schemas come from the Zod contracts through `fastify-type-provider-zod` (see ADR 0004).
- Built-in structured logging (pino) provides the request side of Loom's observability.
- Encapsulated plugins: one plugin per feature area (`agent-runs`, later `workflows`, `proposals`, …).
- `onClose` hooks stop the Copilot client and database pool on shutdown.

## Consequences

- Hono is lighter and runtime-agnostic, but Loom runs only on Node.js and benefits more from Fastify's lifecycle hooks, logging and plugin encapsulation.
- Express would be familiar to more participants but lacks schema-driven validation and typed routes without extra libraries.
- Participants new to Fastify need a short introduction to plugins and hooks in Session 1 material.
