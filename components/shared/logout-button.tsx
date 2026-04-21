"use client";

import { useEffect, useState } from "react";

export function LogoutButton() {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  async function handleLogout() {
    setError("");
    setIsPending(true);

    const response = await fetch("/api/auth/logout", {
      method: "POST"
    });

    if (!response.ok) {
      setError("退出失败，请稍后重试");
      setIsPending(false);
      return;
    }

    window.localStorage.removeItem("stoma_atlas_token");
    window.location.assign("/");
  }

  return (
    <div className="logout-stack">
      <button
        className="button-secondary"
        disabled={isPending || !isReady}
        onClick={handleLogout}
        type="button"
      >
        {!isReady ? "准备退出..." : isPending ? "退出中..." : "退出登录"}
      </button>
      {error ? <p className="inline-error">{error}</p> : null}
    </div>
  );
}
