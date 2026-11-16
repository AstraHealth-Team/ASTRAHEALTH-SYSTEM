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
    finding: "Palpitaciones / ritmo irregular",
    source: "simulacion",
  },
];

describe("ChangeHistoryBell", () => {
  it("opens recent changes and resets triage from the popover", () => {
    const onReset = vi.fn();
    render(<ChangeHistoryBell history={history} onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: "Historial de cambios: 1 evento" }));

    expect(screen.getByRole("heading", { name: "Historial de Cambios" })).toBeInTheDocument();
    expect(screen.getByText(/Palpitaciones \/ ritmo irregular/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restablecer Todo a Verde" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.queryByRole("heading", { name: "Historial de Cambios" })).not.toBeInTheDocument();
  });
});
