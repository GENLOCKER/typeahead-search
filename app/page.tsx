"use client";

import { TypeaheadSearch } from "@/components/TypeaheadSearch";

export default function Home() {
  return (
    <main className="page">
      <div className="page__content">
        <h1>Word search</h1>
        <p className="page__hint">
          Try typing a few letters (e.g. &ldquo;uni&rdquo;, &ldquo;ger&rdquo;,
          &ldquo;zzzz&rdquo; for no results). Use ↑/↓ and Enter to navigate.
        </p>
        <TypeaheadSearch
          onSelect={(result) => console.log("selected", result.word)}
        />
      </div>
    </main>
  );
}
