"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  const message = error.message?.trim() || (error.digest ? `服务器错误编号：${error.digest}` : "系统加载失败，请重试。");

  return (
    <html lang="zh-CN">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
          <section style={{ maxWidth: 560, border: "1px solid #ffe4e6", borderRadius: 28, background: "white", padding: 32, boxShadow: "0 30px 90px rgba(15,23,42,0.12)" }}>
            <p style={{ margin: 0, color: "#e11d48", fontSize: 13, fontWeight: 700, letterSpacing: "0.24em" }}>系统出错</p>
            <h1 style={{ margin: "16px 0 0", color: "#020617", fontSize: 30 }}>系统没有正确加载</h1>
            <p style={{ marginTop: 16, borderRadius: 16, background: "#fff1f2", padding: 16, color: "#be123c", lineHeight: 1.8 }}>{message}</p>
            <button type="button" onClick={() => reset()} style={{ marginTop: 20, border: 0, borderRadius: 999, background: "#020617", color: "white", padding: "10px 20px", fontWeight: 700 }}>
              重新加载
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
