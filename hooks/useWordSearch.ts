import { useEffect, useReducer, useRef } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import { searchWords, WordResult } from "@/lib/wordsApi";

export const MIN_QUERY_LENGTH = 2;
export const DEBOUNCE_MS = 300;

export type SearchStatus = "idle" | "loading" | "success" | "error";

interface State {
  status: SearchStatus;
  results: WordResult[];
  errorMessage: string | null;
}

type Action =
  | { type: "RESET" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; results: WordResult[] }
  | { type: "FETCH_ERROR"; message: string };

const initialState: State = { status: "idle", results: [], errorMessage: null };

function reducer(state: State, action:Action): State {
switch(action.type){
case "RESET":
return initialState;
case "FETCH_START":
return {status: "loading", results: state.results, errorMessage: null};
case "FETCH_SUCCESS":
return {status: "success", results: action.results, errorMessage: null};
case "FETCH_ERROR":
return {status: "error", results: [], errorMessage: action.message};
}
}

export function useWordSearch(rawQuery: string) {
  const query = rawQuery.trim();
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Track the latest request ID so we can drop stale results.
  const latestRequestId = useRef(0);

  // Cache results by query.
  const cache = useRef(new Map<string, WordResult[]>());

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      dispatch({ type: "RESET" });
      return;
    }

    const cached = cache.current.get(debouncedQuery.toLowerCase());
    if (cached) {
      dispatch({ type: "FETCH_SUCCESS", results: cached });
      return;
    }

    const requestId = ++latestRequestId.current;
    const controller = new AbortController();

    dispatch({ type: "FETCH_START" });

    searchWords(debouncedQuery, controller.signal)
      .then((results) => {
        if (requestId !== latestRequestId.current) return; // stale, drop it
        cache.current.set(debouncedQuery.toLowerCase(), results);
        dispatch({ type: "FETCH_SUCCESS", results });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (requestId !== latestRequestId.current) return; // stale, drop it
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        dispatch({ type: "FETCH_ERROR", message });
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return {
    status: query.length < MIN_QUERY_LENGTH ? "idle" : state.status,
    results: state.results,
    errorMessage: state.errorMessage,
    isQueryTooShort: query.length > 0 && query.length < MIN_QUERY_LENGTH,
  } as const;
}
