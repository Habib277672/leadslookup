"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      gutter={8}
      containerStyle={{ top: 64 }} // below the 56px header
      toastOptions={{
        duration: 4000,
        className: "ll-toast",
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: "0.375rem",
          boxShadow: "none",
          fontSize: "0.875rem",
          maxWidth: "24rem",
          padding: "10px 14px",
        },
        success: {
          iconTheme: {
            primary: "var(--foreground)",
            secondary: "var(--background)",
          },
        },
        error: {
          duration: 6000,
          style: { border: "1px solid var(--destructive)" },
          iconTheme: {
            primary: "var(--destructive)",
            secondary: "var(--background)",
          },
        },
      }}
    />
  );
}
