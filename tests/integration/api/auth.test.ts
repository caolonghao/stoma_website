import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me } from "@/app/api/auth/me/route";

describe("auth api", () => {
  it("registers a patient and returns a jwt", async () => {
    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Zhang San",
        phone: "13800000001",
        password: "StrongPass123"
      }),
      headers: {
        "content-type": "application/json"
      }
    });

    const response = await register(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.token).toEqual(expect.any(String));
    expect(body.user.role).toBe("patient");
  });

  it("logs in a doctor and returns a jwt", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        account: "doctor",
        password: "Doctor123!"
      }),
      headers: {
        "content-type": "application/json"
      }
    });

    const response = await login(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    expect(body.user.role).toBe("doctor");
  });

  it("returns the current user from a bearer token", async () => {
    const loginRequest = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        account: "doctor",
        password: "Doctor123!"
      }),
      headers: {
        "content-type": "application/json"
      }
    });

    const loginResponse = await login(loginRequest);
    const loginBody = await loginResponse.json();

    const meRequest = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        authorization: `Bearer ${loginBody.token}`
      }
    });

    const meResponse = await me(meRequest);
    const meBody = await meResponse.json();

    expect(meResponse.status).toBe(200);
    expect(meBody.user.role).toBe("doctor");
    expect(meBody.user.name).toBe("Dr. Lin");
  });
});
