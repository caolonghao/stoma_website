import { describe, expect, it } from "vitest";
import {
  canAccessPortal,
  getHomeDestination
} from "@/lib/auth/page-access";

describe("page access", () => {
  it("sends a doctor to the doctor workspace", () => {
    expect(
      getHomeDestination({ sub: "u1", role: "doctor", name: "Dr. Lin" })
    ).toBe("/doctor/patients");
  });

  it("sends a patient to the patient workspace", () => {
    expect(
      getHomeDestination({ sub: "u2", role: "patient", name: "Li Lei" })
    ).toBe("/patient/dashboard");
  });

  it("keeps the public home screen for signed-out users", () => {
    expect(getHomeDestination(null)).toBeNull();
  });

  it("blocks a patient from doctor routes", () => {
    expect(
      canAccessPortal({ sub: "u2", role: "patient", name: "Li Lei" }, "doctor")
    ).toBe(false);
  });
});
