// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiStatusBadge } from "@/components/shared/ai-status-badge";

describe("AiStatusBadge", () => {
  it("renders a pending state label", () => {
    render(<AiStatusBadge status="queued" />);
    expect(screen.getByText("AI 排队中")).toBeInTheDocument();
  });

  it("renders a completed state label", () => {
    render(<AiStatusBadge status="succeeded" />);
    expect(screen.getByText("AI 已完成")).toBeInTheDocument();
  });
});
