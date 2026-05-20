// @vitest-environment jsdom

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedAuthCard } from "@/components/auth/unified-auth-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

describe("UnifiedAuthCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      configurable: true
    });
  });

  it("defaults to patient login", () => {
    render(<UnifiedAuthCard />);

    expect(
      screen.getByRole("heading", { name: "患者登录" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeVisible();
  });

  it("switches from patient login to patient register", async () => {
    const user = userEvent.setup();

    render(<UnifiedAuthCard />);
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByLabelText("姓名")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "患者注册" })
    ).toBeInTheDocument();
  });

  it("switches to doctor mode and hides the patient register toggle", async () => {
    const user = userEvent.setup();

    render(<UnifiedAuthCard />);
    await user.click(screen.getByRole("button", { name: "医生" }));

    expect(
      screen.getByRole("heading", { name: "医生登录" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "注册" })).not.toBeInTheDocument();
  });
});
