# Word Typeahead Search

A debounced, keyboard-navigable autocomplete built against the public
[Datamuse API](https://www.datamuse.com/api/) (no key required, CORS-enabled).
Built with Next.js (App Router) + TypeScript.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest, jsdom + Testing Library
```

## Structure

- `components/TypeaheadSearch.tsx` — the UI: input, listbox, keyboard handling, ARIA combobox wiring.
- `hooks/useWordSearch.ts` — debounce → fetch → race-condition handling, decoupled from the UI so it's unit-testable on its own.
- `hooks/useDebouncedValue.ts` — small generic debounce hook.
- `lib/wordsApi.ts` — the only file that knows about Datamuse; swap it for any other API without touching the component.
- `components/TypeaheadSearch.test.tsx` — behavioral tests (see write-up).

---

## Write-up

**Tradeoffs.** I debounced input at 300ms and set a 2-character minimum before firing a request — balances responsiveness against not hammering the API on every keystroke. I used `AbortController` plus a monotonically increasing request-id ref to guard against out-of-order responses: abort handles the common case, but the id check is a belt-and-braces fallback since abort isn't guaranteed to suppress an in-flight response in every environment. I added a small in-memory cache (per session, no TTL/eviction) so re-typing a prefix doesn't re-hit the network — fine for a demo, not for a long-lived session. I chose a `useReducer`-based status machine (idle/loading/success/error) over multiple `useState` booleans to keep state transitions atomic and avoid impossible states (e.g. loading+error simultaneously).

**Scaling/hardening.** For real traffic I'd put a caching proxy or edge function in front of the search endpoint (keyed by normalized query prefix) to absorb repeat queries across users, add client-side rate limiting/backoff on 429s, and move the API key (if any) server-side via a route handler rather than calling a third-party API directly from the browser. I'd also add request coalescing so identical in-flight queries from multiple components share one promise, and consider a CDN-cached suggestions index for very common prefixes.

**Testing.** I unit-tested the hook/component with Vitest + Testing Library: debounce timing, stale-response ordering (a slow first request resolving after a faster second one must not clobber the UI), empty state, error state, and full keyboard navigation (arrows, Enter, Escape). I'd add integration tests against a mocked HTTP layer for retry/backoff behavior and a couple of Playwright e2e tests for real browser timing.
