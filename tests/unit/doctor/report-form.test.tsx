// @vitest-environment jsdom

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportForm } from "@/components/doctor/report-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("ReportForm", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => "test-token"),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      configurable: true
    });
  });

  it("uses normal as the no-complication state and excludes normal from complication categories", async () => {
    const user = userEvent.setup();

    render(
      <ReportForm
        aiCategories={["正常"]}
        followupId="followup-1"
        initialReport={null}
      />
    );

    expect(screen.getByRole("button", { name: "正常" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "有并发症" }));

    expect(screen.queryByRole("heading", { name: "正常" })).not.toBeInTheDocument();
    expect(screen.getByText("肠管及系膜并发症")).toBeInTheDocument();
    expect(screen.getByText("腹壁切口并发症")).toBeInTheDocument();
    expect(screen.getByText("腹壁隧道并发症")).toBeInTheDocument();
    expect(screen.getByText("周围皮肤并发症")).toBeInTheDocument();
  });
});
