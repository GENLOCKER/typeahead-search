# Write-up

**Tradeoffs.** Input is debounced 300ms with a 2-character minimum, so we're not firing a request on every keystroke. Stale responses are handled two ways: an `AbortController` cancels the in-flight request when a newer one starts, and a request-id counter double-checks that the response we're about to render is still the latest one — belts and braces, since abort isn't reliably respected everywhere. Results are cached in memory per session (no eviction), so re-typing a prefix is free. State is modeled as a single reducer (idle/loading/success/error) rather than separate booleans, so the UI can't end up in a contradictory state like "loading" and "error" at once.

**Scaling/hardening.** For real traffic I'd add a caching layer (CDN or edge function) in front of the search endpoint keyed by normalized query, move any API key server-side behind a route handler instead of calling the third-party API from the browser, add rate-limit/backoff handling for 429s, and coalesce duplicate in-flight requests across components.

**Testing.** Unit tests (Vitest + Testing Library) cover debounce timing, stale-response ordering (a slow first request must not overwrite a faster second one), loading/empty/error states, and full keyboard navigation. Next steps would be Playwright e2e tests for real browser timing and a couple of retry/backoff tests against a mocked HTTP layer.
