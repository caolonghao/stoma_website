import { describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";

describe("jwt auth", () => {
  it("signs and verifies a doctor token", async () => {
    const token = await signJwt({ sub: "u1", role: "doctor", name: "Dr. Lin" });
    const payload = await verifyJwt(token);

    expect(payload.role).toBe("doctor");
    expect(payload.sub).toBe("u1");
    expect(payload.name).toBe("Dr. Lin");
  });
});
