# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing Next.js code | next-best-practices | .agents/skills/next-best-practices/SKILL.md |
| When writing TypeScript code | typescript-expert | .agents/skills/typescript-expert/SKILL.md |
| When writing tests | vitest | .agents/skills/vitest/SKILL.md |
| When building frontend interfaces | frontend-design | .agents/skills/frontend-design/SKILL.md |
| When working with React/Next.js performance | vercel-react-best-practices | .agents/skills/vercel-react-best-practices/AGENTS.md |
| When testing E2E | playwright-e2e-testing | .agents/skills/playwright-e2e-testing/SKILL.md |
| When testing frontend | frontend-testing-best-practices | .agents/skills/frontend-testing-best-practices/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### next-best-practices
- Use `'use client'` only for components with interactivity/hooks
- Server Components by default, async params/searchParams in Next.js 15+
- Use `next/image` instead of `<img>` tags
- Export `metadata` from page/layout files
- Use `error.tsx`, `loading.tsx`, `not-found.tsx` for error handling
- Avoid barrel file imports (use direct imports)

### typescript-expert
- Use `const` objects with `as const` for enums/status values
- Flat interfaces, no inline nested objects
- NEVER use `any` - use `unknown` with type guards
- Use `interface` over `type` for object shapes
- `import type` for type-only imports

### frontend-design
- Choose distinctive fonts, avoid Inter/Roboto
- Commit to cohesive aesthetic with CSS variables
- Use animations for effects and micro-interactions
- Create atmospheric backgrounds with textures/patterns
- Avoid generic "AI slop" aesthetics

### vercel-react-best-practices
- Use `Promise.all()` for parallel async operations
- Avoid barrel file imports (200-800ms import cost)
- Use `dynamic()` imports for heavy components
- Server Actions: authenticate INSIDE the action
- Use `React.cache()` for server-side deduplication
- Derive state during render, avoid useEffect for derived state
- Use functional setState: `setItems(curr => ...)`

### vitest
- Use `describe`/`test` for grouping and test cases
- Use `expect` with matchers: `toBe`, `toEqual`, `toMatchObject`
- Mock with `vi.fn()`, `vi.mock()`, `vi.spyOn()`
- Use `beforeEach`/`afterEach` for cleanup
- Run with `npx vitest run` for CI, `npx vitest` for dev

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| Architecture doc | docs/ARCHITECTURE.md | File flow, state management, theming |
| AGENTS.md | .agents/skills/vercel-react-best-practices/AGENTS.md | React/Next.js best practices |

## Stack Summary

- **Framework**: Next.js 16.1.6 + React 19.2.4
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.2 + Radix UI components
- **UI Components**: Shadcn/ui pattern (components/ui/*)
- **PDF Handling**: @embedpdf/react-pdf-viewer, react-doc-viewer
- **Forms**: React Hook Form + Zod
- **State**: In-memory store (Map) + sessionStorage for file metadata
- **Analytics**: Vercel Analytics
