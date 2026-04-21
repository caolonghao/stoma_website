import { describe, expect, it } from "vitest";
import { requireRole, requireSelfOrDoctor } from "@/lib/permissions/guards";

describe("permission guards", () => {
  it("allows only doctors for doctor-only routes", () => {
    expect(() =>
      requireRole(
        { sub: "doctor-1", role: "doctor", name: "Dr. Lin" },
        ["doctor"]
      )
    ).not.toThrow();

    expect(() =>
      requireRole(
        { sub: "patient-1", role: "patient", name: "Zhang" },
        ["doctor"]
      )
    ).toThrow(/insufficient permissions/i);
  });

  it("lets doctors access any patient record but limits patients to themselves", () => {
    expect(
      requireSelfOrDoctor(
        { sub: "doctor-1", role: "doctor", name: "Dr. Lin" },
        "patient-9"
      )
    ).toBe(true);

    expect(
      requireSelfOrDoctor(
        { sub: "patient-9", role: "patient", name: "Zhang" },
        "patient-9"
      )
    ).toBe(true);

    expect(() =>
      requireSelfOrDoctor(
        { sub: "patient-9", role: "patient", name: "Zhang" },
        "patient-1"
      )
    ).toThrow(/not allowed/i);
  });
});
