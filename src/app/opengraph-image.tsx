import { ImageResponse } from "next/og";

export const alt = "Varko — Park anywhere, host anywhere";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 120,
            border: "4px dashed rgba(255,255,255,0.5)",
            borderRadius: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 90,
              height: 60,
              borderRadius: 16,
              background: "white",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 110,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.03em",
          }}
        >
          varko
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            marginTop: 16,
          }}
        >
          Park anywhere. Host anywhere.
        </div>
      </div>
    ),
    { ...size },
  );
}
