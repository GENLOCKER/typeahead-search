"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useWordSearch, MIN_QUERY_LENGTH } from "@/hooks/useWordSearch";
import type { WordResult } from "@/lib/wordsApi";

interface TypeaheadSearchProps {
  onSelect?: (result: WordResult) => void;
  placeholder?: string;
}

export function TypeaheadSearch({
  onSelect,
  placeholder = "Start typing a word…",
}: TypeaheadSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const { status, results, errorMessage, isQueryTooShort } =
    useWordSearch(query);

  const listboxId = useId();
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Open on results.
  useEffect(() => {
    setHighlightedIndex(-1);
    if (status === "loading" || status === "error" || status === "success") {
      setIsOpen(true);
    }
  }, [status, results]);

  // Close on outside click.
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectResult(result: WordResult) {
    setSelectedLabel(result.word);
    setQuery(result.word);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect?.(result);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (event.key === "ArrowDown" && results.length > 0) setIsOpen(true);
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((i) => (i + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          event.preventDefault();
          selectResult(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  }

  const activeDescendant =
    highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined;

  return (
    <div className="typeahead" ref={containerRef}>
      <label htmlFor={inputId} className="typeahead__label">
        Word
      </label>

      <div className="typeahead__input-wrap">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          autoComplete="off"
          className="typeahead__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedLabel(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {status === "loading" && (
          <span className="typeahead__spinner" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <ul id={listboxId} role="listbox" className="typeahead__listbox">
          {isQueryTooShort && (
            <li className="typeahead__status" aria-live="polite">
              Keep typing — {MIN_QUERY_LENGTH}+ characters to search.
            </li>
          )}

          {!isQueryTooShort && status === "loading" && (
            <li className="typeahead__status" aria-live="polite">
              Searching…
            </li>
          )}

          {!isQueryTooShort && status === "error" && (
            <li className="typeahead__status typeahead__status--error" aria-live="assertive">
              {errorMessage ?? "Something went wrong."} Try again.
            </li>
          )}

          {!isQueryTooShort &&
            status === "success" &&
            results.length === 0 && (
              <li className="typeahead__status" aria-live="polite">
                No matches for “{query}”.
              </li>
            )}

          {!isQueryTooShort &&
            status === "success" &&
            results.map((result, index) => (
              <li
                key={result.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={
                  "typeahead__option" +
                  (index === highlightedIndex
                    ? " typeahead__option--highlighted"
                    : "") +
                  (result.word === selectedLabel
                    ? " typeahead__option--selected"
                    : "")
                }
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => {
                  // prevent blurring the input
                  e.preventDefault();
                  selectResult(result);
                }}
              >
                <span>{result.word}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
