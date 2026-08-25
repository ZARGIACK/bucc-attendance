"use client";

/**
 * Last-resort boundary: catches errors thrown by the ROOT LAYOUT itself
 * (theme provider, session provider, font loading), which `error.tsx`
 * cannot catch because it renders inside that layout.
 *
 * It replaces the layout, so it must supply its own <html>/<body>. Styles
 * are inline on purpose — if the layout blew up, its stylesheet may never
 * have been applied, and an unreadable error page is no better than a
 * blank one.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081226",
          color: "#ffffff",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>BUCC Attendance is unavailable</h1>
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>
            The app failed to start on this device. Your attendance records are stored on the server and are
            not affected.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              height: "3rem",
              width: "100%",
              borderRadius: "0.75rem",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
            Report this code to an HR SE: <span style={{ fontFamily: "monospace" }}>{error.digest ?? "n/a"}</span>
          </p>
        </div>
      </body>
    </html>
  );
}
