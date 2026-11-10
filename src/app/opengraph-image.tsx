import { ImageResponse } from "next/og";

export const alt = "LeadsLookup: find businesses and organize your outreach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0a0a0a",
        color: "#fafafa",
        padding: 80,
      }}
    >
      <div style={{ display: "flex", fontSize: 36, fontWeight: 600 }}>
        LeadsLookup
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Find businesses. Organize your outreach.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#a3a3a3",
            marginTop: 28,
          }}
        >
          Lead discovery for freelancers
        </div>
      </div>
    </div>,
    { ...size },
  );
}
