import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  bg:      "#000000",
  surface: "rgba(245,245,243,0.03)",
  line:    "rgba(255,255,255,0.1)",
  lineHi:  "rgba(255,255,255,0.35)",
  white:   "#f5f5f3",
  muted:   "rgba(245,245,243,0.4)",
  faint:   "rgba(245,245,243,0.18)",
  fainter: "rgba(245,245,243,0.12)",
  mono:    "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",
  sans:    "'SF Pro Display',system-ui,-apple-system,sans-serif",
};

/* ─── Ambient orb ───────────────────────────────────────────────── */
function Orb({ top, left, size, color }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", top, left, width: size, height: size,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

/* ─── Scanline overlay ──────────────────────────────────────────── */
function Scanlines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.011) 2px,rgba(255,255,255,0.011) 4px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ─── Scan-target corner bracket ────────────────────────────────── */
function Corner({ pos }) {
  const size = 18;
  const base = { position: "absolute", width: size, height: size };
  const b = "1.5px solid rgba(255,255,255,0.45)";
  const styles = {
    tl: { ...base, top: 10, left: 10,  borderTop: b, borderLeft: b,  borderRadius: "3px 0 0 0" },
    tr: { ...base, top: 10, right: 10, borderTop: b, borderRight: b, borderRadius: "0 3px 0 0" },
    bl: { ...base, bottom: 10, left: 10,  borderBottom: b, borderLeft: b,  borderRadius: "0 0 0 3px" },
    br: { ...base, bottom: 10, right: 10, borderBottom: b, borderRight: b, borderRadius: "0 0 3px 0" },
  };
  return <div style={styles[pos]} />;
}

/* ─── Tip card ──────────────────────────────────────────────────── */
function Tip({ icon, text }) {
  return (
    <div style={{
      flex: 1,
      display: "flex", alignItems: "flex-start", gap: 8,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "10px 10px",
    }}>
      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", lineHeight: 1.5, fontFamily: T.sans }}>{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Upload() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const containerRef  = useRef(null);
  const headingRef    = useRef(null);
  const eyebrowRef    = useRef(null);
  const subRef        = useRef(null);
  const dropzoneRef   = useRef(null);
  const tipsRef       = useRef(null);
  const btnRef        = useRef(null);
  const backRef       = useRef(null);
  const inputRef      = useRef(null);
  const previewRef    = useRef(null);
  const scanLineRef   = useRef(null);

  /* ── entrance ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = [backRef.current, eyebrowRef.current, headingRef.current,
                   subRef.current, dropzoneRef.current, tipsRef.current, btnRef.current];
      gsap.set(els, { opacity: 0, y: 18 });
      els.forEach((el, i) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.08 + i * 0.07 });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  /* ── scan-line animation after image loads ── */
  const runScanLine = () => {
    const el = scanLineRef.current;
    if (!el) return;
    gsap.set(el, { opacity: 1, top: "10%" });
    gsap.to(el, {
      top: "90%", duration: 1.6, ease: "power1.inOut",
      onComplete: () => gsap.to(el, { opacity: 0, duration: 0.3 }),
    });
  };

  /* ── handle incoming file ── */
  const handleChange = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);

    if (imagePreview && previewRef.current) {
      gsap.to(previewRef.current, {
        opacity: 0, scale: 0.97, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          setImagePreview(url);
          requestAnimationFrame(() => {
            gsap.fromTo(previewRef.current,
              { opacity: 0, scale: 0.97 },
              { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
            );
            runScanLine();
          });
        },
      });
    } else {
      setImagePreview(url);
      requestAnimationFrame(() => {
        if (previewRef.current) {
          gsap.fromTo(previewRef.current,
            { opacity: 0, scale: 0.95, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out" }
          );
        }
        runScanLine();
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    gsap.to(dropzoneRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
    handleChange(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
    gsap.to(dropzoneRef.current, { scale: 1.015, duration: 0.2, ease: "power2.out" });
  };

  const handleDragLeave = () => {
    setIsDragging(false);
    gsap.to(dropzoneRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
  };

  /* ── analyze ── */
  const handleAnalyze = () => {
    if (!imagePreview || isAnalyzing) return;
    setIsAnalyzing(true);
    gsap.to(btnRef.current, {
      scale: 0.97, duration: 0.1, ease: "power2.in",
      onComplete: () => {
        gsap.to(btnRef.current, { scale: 1, duration: 0.15, ease: "power2.out" });
        setTimeout(() => {
          gsap.to(containerRef.current, {
            opacity: 0, y: -16, duration: 0.35, ease: "power2.in",
            onComplete: () => navigate("/results", { state: { imageUrl: imagePreview } }),
          });
        }, 600);
      },
    });
  };

  const handleBack = () => {
    gsap.to(containerRef.current, {
      opacity: 0, y: 16, duration: 0.3, ease: "power2.in",
      onComplete: () => navigate(-1),
    });
  };

  const borderColor = isDragging ? T.lineHi : imagePreview ? "rgba(255,255,255,0.12)" : T.line;

  return (
    <div style={{
      minHeight: "100dvh", background: T.bg, color: T.white,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: T.sans, position: "relative", overflow: "hidden",
    }}>
      <Scanlines />
      <Orb top="-120px" left="-80px"  size="360px" color="rgba(100,60,255,0.1)" />
      <Orb top="55%"   left="60%"     size="260px" color="rgba(60,180,255,0.07)" />

      <div ref={containerRef} style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* ── Back ── */}
        <button
          ref={backRef}
          onClick={handleBack}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            color: T.faint, fontSize: 11, letterSpacing: "0.18em",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, marginBottom: "2rem",
            fontFamily: T.mono, transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.muted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.faint)}
        >
          <BackIcon />
          BACK
        </button>

        {/* ── Heading ── */}
        <p ref={eyebrowRef} style={{
          fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", margin: "0 0 10px",
          fontFamily: T.mono,
        }}>
          Sample · 01 of 01
        </p>
        <h1 ref={headingRef} style={{
          fontSize: 28, fontWeight: 500, margin: "0 0 8px",
          letterSpacing: "-0.025em", lineHeight: 1.15,
        }}>
          Upload a selfie
        </h1>
        <p ref={subRef} style={{ fontSize: 13, color: T.muted, margin: "0 0 1.75rem", lineHeight: 1.6 }}>
          Use a clear, front-facing photo in good lighting<br />for the most accurate Glow Score.
        </p>

        {/* ── Dropzone ── */}
        <div
          ref={dropzoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !imagePreview && inputRef.current?.click()}
          style={{
            position: "relative",
            width: "100%",
            borderRadius: 12,
            cursor: imagePreview ? "default" : "pointer",
            overflow: "hidden",
            border: `1px solid ${borderColor}`,
            background: isDragging ? "rgba(255,255,255,0.06)" : imagePreview ? "transparent" : T.surface,
            minHeight: imagePreview ? "auto" : 220,
            transition: "border-color 0.25s, background 0.25s",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleChange(e.target.files[0])}
            style={{ display: "none" }}
          />

          {/* corner brackets */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />
          </div>

          {/* scan line */}
          <div
            ref={scanLineRef}
            style={{
              position: "absolute", left: 10, right: 10, height: 1,
              background: "rgba(255,255,255,0.22)", top: "10%",
              zIndex: 3, opacity: 0, pointerEvents: "none",
            }}
          />

          {imagePreview ? (
            <div ref={previewRef} style={{ position: "relative" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: "100%", borderRadius: 12, objectFit: "cover", display: "block" }}
              />

              {/* status chip */}
              <div style={{
                position: "absolute", top: 12, left: 12,
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(0,0,0,0.65)", borderRadius: 999,
                padding: "4px 10px",
                fontSize: 10, letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.7)", fontFamily: T.mono, zIndex: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
                LOADED
              </div>

              {/* replace overlay */}
              <div
                onClick={() => inputRef.current?.click()}
                style={{
                  position: "absolute", inset: 0, borderRadius: 12,
                  background: "rgba(0,0,0,0.6)", opacity: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.2s", zIndex: 3,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <CameraIcon />
                <span style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>Replace photo</span>
              </div>
            </div>
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
                transition: "border-color 0.2s, color 0.2s",
              }}>
                <UploadIcon />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, color: T.muted }}>Drop a photo here</p>
                <p style={{
                  fontSize: 10, color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.1em", fontFamily: T.mono, marginTop: 4,
                }}>
                  OR CLICK TO BROWSE
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tips ── */}
        <div ref={tipsRef} style={{ display: "flex", gap: 8, margin: "12px 0 1.5rem" }}>
          <Tip icon="◎" text="Face the camera directly, eyes forward" />
          <Tip icon="☀" text="Even, natural lighting works best" />
          <Tip icon="◻" text="No filters or heavy edits" />
        </div>

        {/* ── Analyze button ── */}
        <button
          ref={btnRef}
          onClick={handleAnalyze}
          disabled={!imagePreview || isAnalyzing}
          style={{
            width: "100%", padding: "15px 0",
            background: imagePreview ? T.white : "rgba(255,255,255,0.06)",
            color: imagePreview ? "#000" : "rgba(255,255,255,0.22)",
            fontSize: 14, fontWeight: 500,
            borderRadius: 12, border: imagePreview ? "none" : "1px solid rgba(255,255,255,0.07)",
            letterSpacing: "0.02em", fontFamily: T.sans,
            cursor: imagePreview && !isAnalyzing ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.15s, background 0.2s",
          }}
          onMouseEnter={(e) => { if (imagePreview) e.currentTarget.style.transform = "scale(1.012)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseDown={(e) => { if (imagePreview) e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { if (imagePreview) e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isAnalyzing ? "Analyzing…" : imagePreview ? "Analyze selfie →" : "Select a photo first"}
        </button>

        {/* ── Footer readout ── */}
        <p style={{
          marginTop: 16, fontSize: 10, color: "rgba(255,255,255,0.18)",
          fontFamily: T.mono, letterSpacing: "0.14em", textAlign: "center",
        }}>
          {isAnalyzing ? "PROCESSING · PLEASE WAIT" : imagePreview ? "READY FOR ANALYSIS" : "AWAITING INPUT"}
        </p>

      </div>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────── */
function BackIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}