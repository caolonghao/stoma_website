import "@testing-library/jest-dom/vitest";
import "@/lib/db/test-reset";

if (process.env.AI_PROVIDER_E2E !== "1") {
  process.env.AI_PROVIDER_BASE_URL = "";
  process.env.AI_PROVIDER_TOKEN = "";
}
