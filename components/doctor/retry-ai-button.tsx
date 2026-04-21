"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RetryAiButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleRetry() {
    setError("");

    const token = window.localStorage.getItem("stoma_atlas_token");
    const response = await fetch(`/api/ai/tasks/${taskId}/retry`, {
      method: "POST",
      headers: token
        ? {
            authorization: `Bearer ${token}`
          }
        : undefined
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "重跑失败");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button className="button-secondary" onClick={handleRetry} type="button">
        {isPending ? "重跑中..." : "重跑 AI"}
      </button>
      {error ? <span style={{ color: "#9a4f40" }}>{error}</span> : null}
    </div>
  );
}
