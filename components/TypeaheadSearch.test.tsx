import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TypeaheadSearch } from "./TypeaheadSearch";

function mockWord(word: string, score = 100) {
  return { word, score };
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

describe("TypeaheadSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not fetch until the debounce window elapses", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(() => jsonResponse([mockWord("germane")]));

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch />);

    await user.type(screen.getByRole("combobox"), "ger");
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it("ignores a stale response that resolves after a newer one", async () => {
    // First request (for "de") resolves *after* the second request (for
    // "deu") — the UI must end up showing the "deu" results, not "de"'s.
    let resolveFirst: (v: Response) => void;
    const firstResponse = new Promise<Response>((res) => {
      resolveFirst = res;
    });

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementationOnce(() => firstResponse)
      .mockImplementationOnce(() => jsonResponse([mockWord("deuterium")]));

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch />);
    const input = screen.getByRole("combobox");

    await user.type(input, "de");
    vi.advanceTimersByTime(300);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    await user.type(input, "u");
    vi.advanceTimersByTime(300);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));

    await waitFor(() =>
      expect(screen.getByText("deuterium")).toBeInTheDocument()
    );

    // Now let the stale first request resolve late.
    resolveFirst!(
      new Response(JSON.stringify([mockWord("desk")]), { status: 200 })
    );

    // Give microtasks a chance to flush, then assert the stale result
    // never overwrote the current one.
    await vi.waitFor(() => {
      expect(screen.queryByText("desk")).not.toBeInTheDocument();
      expect(screen.getByText("deuterium")).toBeInTheDocument();
    });
  });

  it("shows an empty state when the API has no matches", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() => jsonResponse([]));

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch />);

    await user.type(screen.getByRole("combobox"), "zzzz");
    vi.advanceTimersByTime(300);

    await waitFor(() =>
      expect(screen.getByText(/no matches/i)).toBeInTheDocument()
    );
  });

  it("shows an error state on a failed request", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      jsonResponse({ message: "boom" }, 500)
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch />);

    await user.type(screen.getByRole("combobox"), "ger");
    vi.advanceTimersByTime(300);

    await waitFor(() =>
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    );
  });

  it("supports arrow-key navigation and Enter to select", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      jsonResponse([mockWord("germane"), mockWord("germinate")])
    );

    const onSelect = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch onSelect={onSelect} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "ge");
    vi.advanceTimersByTime(300);
    await waitFor(() =>
      expect(screen.getByText("germane")).toBeInTheDocument()
    );

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ word: "germinate" })
    );
  });

  it("closes the listbox on Escape", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      jsonResponse([mockWord("germane")])
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<TypeaheadSearch />);

    const input = screen.getByRole("combobox");
    await user.type(input, "ger");
    vi.advanceTimersByTime(300);
    await waitFor(() =>
      expect(screen.getByText("germane")).toBeInTheDocument()
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
