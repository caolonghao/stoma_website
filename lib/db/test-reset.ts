import { beforeEach } from "vitest";
import { ensureCoreData, resetDatabase } from "@/lib/db/seed";

beforeEach(async () => {
  await resetDatabase();
  await ensureCoreData();
});
