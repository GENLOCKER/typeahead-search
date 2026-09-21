# Word Typeahead Search

A debounced, keyboard-navigable autocomplete built against the public
[Datamuse API](https://www.datamuse.com/api/)
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
- `components/TypeaheadSearch.test.tsx` — behavioral tests.

See [WRITEUP.md](./WRITEUP.md) for tradeoffs, scaling notes, and testing approach.

