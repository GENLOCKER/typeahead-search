

export interface WordResult {
  id: string; 
  word: string;
  score: number;
}

export class WordSearchError extends Error {}

interface RawWord {
  word?: string;
  score?: number;
}

export async function searchWords(
  query: string,
  signal: AbortSignal
): Promise<WordResult[]> {
  const url = `https://api.datamuse.com/sug?s=${encodeURIComponent(
    query
  )}&max=10`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new WordSearchError(`Word search failed with status ${res.status}`);
  }

  const data = (await res.json()) as RawWord[];

  return data.map(
    (w): WordResult => ({
      id: w.word ?? Math.random().toString(36),
      word: w.word ?? "",
      score: w.score ?? 0,
    })
  );
}
