# Country Typeahead Search

A debounced, keyboard-navigable autocomplete built against the public
[REST Countries API](https://restcountries.com/) (no key required). Built
with Next.js (App Router) + TypeScript.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest, jsdom + Testing Library
```

## Structure

- `components/TypeaheadSearch.tsx` — the UI: input, listbox, keyboard handling, ARIA combobox wiring.
- `hooks/useCountrySearch.ts` — debounce → fetch → race-condition handling, decoupled from the UI so it's unit-testable on its own.
- `hooks/useDebouncedValue.ts` — small generic debounce hook.
- `lib/countriesApi.ts` — the only file that knows about REST Countries; swap it for any other API without touching the component.
- `components/TypeaheadSearch.test.tsx` — behavioral tests (see write-up).

---

## Write-up

**Tradeoffs.** I split fetch/debounce logic into a hook (`useCountrySearch`) separate from rendering, so the race-condition handling is unit-testable without simulating DOM events. For staleness, I combined `AbortController` with a monotonically increasing request-id ref — abort covers the network layer, but isn't a hard guarantee across all environments, so the id check is the actual source of truth for "is this still the response I want." I added a 2-character minimum and a tiny in-memory result cache to cut needless calls, at the cost of slightly more state to reason about. I used the browser's `fetch` directly rather than a data-fetching library (React Query, SWR) to keep the dependency surface small for a screening exercise, but in a real app I'd reach for one immediately — it gives you caching, retries, and race-safety for free.

**Scaling/hardening.** Behind a real search endpoint I'd add: a CDN/edge cache keyed on normalized query + locale; per-IP rate limiting and a request budget on the client (cancel-in-flight is already race-safe, but I'd also cap concurrent requests); a p99 latency budget with a fast local-first "no network" fallback for very short/common prefixes; retries with jittered backoff for 5xx only; and telemetry on empty-result and error rates to catch upstream API degradation early.

**Testing.** Fake timers + mocked `fetch` to assert debounce timing precisely; an explicit out-of-order-resolution test (first request resolves after a second, later one) to prove staleness handling; keyboard-navigation and selection tests via Testing Library's `userEvent`; and error/empty-state tests. I'd add Playwright for a real-browser smoke test and axe for automated a11y checks in CI.
