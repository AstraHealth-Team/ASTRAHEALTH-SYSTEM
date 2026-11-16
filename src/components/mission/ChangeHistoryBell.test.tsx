import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HistoryEntry } from "@/lib/triage";
import { ChangeHistoryBell } from "./ChangeHistoryBell";

const history: HistoryEntry[] = [
  {
    id: "event-1",
    at: "2026-11-15T18:00:00.000Z",
    system: "cardio",
    level: "yellow",
    finding: "Palpitations / irregular rhythm",
    source: "simulation",
  },
];

describe("ChangeHistoryBell", () => {
  it("opens recent changes and resets triage from the popover", () => {
    const onReset = vi.fn();
    render(<ChangeHistoryBell history={history} onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: "Change History: 1 event" }));

    expect(screen.getByRole("heading", { name: "Change History" })).toBeInTheDocument();
    expect(screen.getByText(/Palpitations \/ irregular rhythm/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset All to Nominal" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Change History" })).not.toBeInTheDocument();
  });
});
