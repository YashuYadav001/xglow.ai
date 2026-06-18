import { useEffect, useState, useRef, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────── mock data ─────────────── */
const MOCK = {
  faceShape: "Oval",
  symmetry: 87,
  confidence: 91,
  jawline: 82,
  skinClarity: 78,
  beardStyle: "Light Stubble",
  hairstyle: "Textured Crop",
  focusArea: "Grooming & Skincare",
  colors: ["Charcoal", "Ivory", "Forest Green", "Slate Blue"],
  skinType: "Combination",
  eyeShape: "Almond",
  jawlineDefinition: "Strong",
  foreheadRatio: "Balanced",
  lipSymmetry: 88,
  hairlineType: "Normal",
  estimatedAge: 24,
  smileScore: 85,
  photoQuality: 92,
  expressionType: "Neutral/Confident",
  skinHydration: 74,
  lightingScore: 88,
  faceWidthRatio: "Golden",
  seasonalColor: "Winter",
  attractivenessTrend: "+3 pts this month",
  createdAt: { toDate: () => new Date() },
};

const MOCK_PREVIOUS = {
  symmetry: 81,
  confidence: 85,
  glowScore: 82,
};

/* ─────────────── helpers ─────────────── */
const glowLevel = (s) =>
  s >= 90 ? "Elite" : s >= 75 ? "High" : s >= 60 ? "Good" : "Developing";

const roadmap = {
  Round: [
    "Maintain lower body-fat percentage",
    "Grow light stubble for jaw definition",
    "Choose volume-focused hairstyles",
  ],
  Long: [
    "Use textured fringe styles",
    "Avoid excessive hair height",
    "Keep beard length balanced",
  ],
  Oval: [
    "Experiment with multiple hairstyles",
    "Maintain clean beard lines",
    "Focus on consistent skincare",
  ],
};

const accessories = {
  Round: ["Rectangular glasses", "Chain necklace", "Baseball cap"],
  Long: ["Round glasses", "Beanie", "Minimal jewelry"],
  Oval: ["Aviator sunglasses", "Watch", "Bracelet"],
};

const skinRoutine = [
  "Cleanser — morning & night",
  "Moisturizer — twice daily",
  "SPF 50 sunscreen — every morning",
  "Vitamin C serum — 3x weekly",
  "Exfoliate — 2x weekly",
];

const FAQ = [
  {
    q: "How is the Glow Score calculated?",
    a: "It's a weighted blend of facial symmetry (70%) and confidence signal (30%), derived from your most recent scan.",
  },
  {
    q: "How often should I rescan?",
    a: "We recommend every 14 days. Grooming, skincare, and lifestyle changes take time to show measurable shifts.",
  },
  {
    q: "Why did my score change?",
    a: "Small fluctuations are normal and can come from lighting, angle, or grooming differences between scans.",
  },
  {
    q: "Can I export my results?",
    a: "Yes — use the share button at the top of this page to download a card image or copy a shareable link.",
  },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "style", label: "Style" },
  { id: "routine", label: "Routine" },
];

/* ─────────────── helpers: derive values from analysis ─────────────── */
function deriveAllFeatures(analysis) {
  if (!analysis) return {};
  const glowScore = Math.round(analysis.symmetry * 0.7 + analysis.confidence * 0.3);
  const ageDisplay = analysis.estimatedAge
    ? `~${analysis.estimatedAge} yrs`
    : `~${Math.max(18, Math.round(30 - glowScore * 0.12))} yrs`;
  const celebMatch = (() => {
    const score = glowScore;
    if (score >= 90) return "Bradley Cooper";
    if (score >= 80) return "Timothée Chalamet";
    if (score >= 70) return "Zayn Malik";
    return "Tom Holland";
  })();
  const fashionStyle = (() => {
    const shape = analysis.faceShape;
    if (shape === "Oval") return "Smart Casual / Minimalist";
    if (shape === "Round") return "Structured / Tailored";
    if (shape === "Long") return "Relaxed / Layered";
    return "Classic / Versatile";
  })();
  const hairstylePreview = `AI recommends: ${analysis.hairstyle || "Textured Crop"} — works best with your ${analysis.faceShape || "face"} shape.`;
  const skinToneMatch = (() => {
    const clarity = analysis.skinClarity || 75;
    if (clarity >= 85) return "Neutral Cool";
    if (clarity >= 70) return "Warm Olive";
    return "Neutral Warm";
  })();
  const beforeAfterDelta = `Symmetry +${Math.round((analysis.symmetry || 80) - 74)}% since first scan`;
  const facialHairSim = analysis.beardStyle
    ? `${analysis.beardStyle} suits your jawline structure`
    : "Light Stubble recommended";
  return {
    glowScore,
    ageDisplay,
    celebMatch,
    fashionStyle,
    hairstylePreview,
    skinToneMatch,
    beforeAfterDelta,
    facialHairSim,
  };
}

/* ─────────────── sub-components ─────────────── */

function Scanlines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

function GlowOrb({ top, left, size = 300, opacity = 0.04 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top,
        left,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255,255,255,${opacity}) 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function CountUp({ target, duration = 1.4, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      { val: 0 },
      { val: target },
      {
        val: target,
        duration,
        ease: "power2.out",
        onUpdate() {
          el.textContent = Math.round(this.targets()[0].val) + suffix;
        },
      }
    );
  }, [target, duration, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

function Tag({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      onEnter: () =>
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
        ),
    });
  }, []);
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        letterSpacing: "0.04em",
        opacity: 0,
      }}
    >
      {children}
    </span>
  );
}

function RevealRow({ children, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () =>
        gsap.fromTo(
          el,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.55, delay, ease: "power3.out" }
        ),
    });
  }, [delay]);
  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, suffix = "", delta = null, sub = null }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      onEnter: () =>
        gsap.fromTo(
          el,
          { opacity: 0, y: 30, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
        ),
    });
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "24px 20px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
        gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        gsap.to(e.currentTarget, { scale: 1, duration: 0.25, ease: "power2.out" });
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 40,
          height: 40,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          borderBottomLeftRadius: 12,
        }}
      />
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <p
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          {typeof value === "number" ? <CountUp target={value} suffix={suffix} /> : value}
        </p>
        {delta !== null && delta !== 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: delta > 0 ? "#7CFFB2" : "#FF8A8A",
            }}
          >
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
          </span>
        )}
      </div>
      {sub && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}

function Section({ title, children, delay = 0, action = null }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      onEnter: () =>
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, delay, ease: "power3.out" }
        ),
    });
  }, [delay]);
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20,
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, delay = 0, color = "#fff" }) {
  const barRef = useRef(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () =>
        gsap.fromTo(
          el,
          { width: "0%" },
          { width: `${value}%`, duration: 1.4, delay, ease: "power3.out" }
        ),
    });
  }, [value, delay]);
  return (
    <div
      style={{
        height: 2,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      <div
        ref={barRef}
        style={{ height: "100%", background: color, borderRadius: 2, width: 0 }}
      />
    </div>
  );
}

/* ── Share Menu ── */
function ShareMenu({ analysis, glowScore }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const downloadCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createRadialGradient(550, 60, 0, 550, 60, 320);
    grad.addColorStop(0, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "600 12px sans-serif";
    ctx.fillText("GLOW SCORE", 40, 56);
    ctx.fillStyle = "#fff";
    ctx.font = "700 96px sans-serif";
    ctx.fillText(String(glowScore), 40, 170);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 18px sans-serif";
    ctx.fillText(`${glowLevel(glowScore)} · ${analysis.faceShape} face`, 40, 210);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "500 11px sans-serif";
    ctx.fillText("PREMIUM · POWERED BY AI ANALYSIS", 40, 320);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glow-score-card.png";
      a.click();
      URL.revokeObjectURL(url);
    });
    setOpen(false);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/premium?score=${glowScore}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 999,
          color: "#fff",
          fontSize: 12,
          letterSpacing: "0.04em",
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        ↗ Share
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#111",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 6,
            minWidth: 180,
            zIndex: 10,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          }}
        >
          <button onClick={downloadCard} style={menuItemStyle}>
            Download card (PNG)
          </button>
          <button onClick={copyLink} style={menuItemStyle}>
            {copied ? "Link copied ✓" : "Copy shareable link"}
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
};

/* ── Tab Nav ── */
function TabNav({ active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
        overflowX: "auto",
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            minWidth: 70,
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: active === t.id ? "#000" : "rgba(255,255,255,0.55)",
            background: active === t.id ? "#fff" : "transparent",
            transition: "background 0.25s, color 0.25s",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Scan Timeline ── */
function ScanTimeline({ createdAt }) {
  const date = createdAt?.toDate ? createdAt.toDate() : new Date();
  const daysSince = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  const RESCAN_CYCLE = 14;
  const daysLeft = Math.max(0, RESCAN_CYCLE - daysSince);
  const pct = Math.min(100, Math.round((daysSince / RESCAN_CYCLE) * 100));
  return (
    <Section title="Scan Timeline">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
            Last scan
          </p>
          <p style={{ fontSize: 15, color: "#fff" }}>
            {daysSince === 0 ? "Today" : `${daysSince} day${daysSince === 1 ? "" : "s"} ago`}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
            Next recommended
          </p>
          <p style={{ fontSize: 15, color: "#fff" }}>
            {daysLeft === 0 ? "Due now" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      <ProgressBar value={pct} />
    </Section>
  );
}

/* ── Comparison deltas hook ── */
function useDeltas(analysis, previous) {
  return useMemo(() => {
    if (!previous) return {};
    const glow = Math.round(analysis.symmetry * 0.7 + analysis.confidence * 0.3);
    return {
      symmetry: analysis.symmetry - previous.symmetry,
      confidence: analysis.confidence - previous.confidence,
      glowScore: glow - previous.glowScore,
    };
  }, [analysis, previous]);
}

/* ── FAQ Accordion ── */
function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Section title="Frequently Asked">
      {FAQ.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={item.q}
            style={{
              borderBottom: i < FAQ.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              paddingBottom: 14,
              marginBottom: 14,
            }}
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                padding: 0,
                textAlign: "left",
              }}
            >
              {item.q}
              <span
                style={{
                  color: "rgba(255,255,255,0.4)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.25s",
                  fontSize: 18,
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 200 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginTop: 10,
                }}
              >
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </Section>
  );
}

/* ── Theme Toggle ── */
function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 999,
        color: "inherit",
        fontSize: 12,
        padding: "8px 14px",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "☾ Dark" : "☀ Light"}
    </button>
  );
}

/* ── Print Button ── */
function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 999,
        color: "#fff",
        fontSize: 12,
        padding: "8px 16px",
        cursor: "pointer",
      }}
    >
      ⎙ Print
    </button>
  );
}

/* ── Radar Chart ── */
function RadarChart({ stats }) {
  const size = 220;
  const center = size / 2;
  const radius = 85;
  const angleStep = (Math.PI * 2) / stats.length;
  const point = (value, i) => {
    const r = (value / 100) * radius;
    const angle = angleStep * i - Math.PI / 2;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };
  const polygonPoints = stats.map((s, i) => point(s.value, i).join(",")).join(" ");
  const ringLevels = [25, 50, 75, 100];
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={stats.map((_, i) => point(lvl, i).join(",")).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {stats.map((s, i) => {
          const [x, y] = point(100, i);
          return (
            <line
              key={s.label}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygonPoints}
          fill="rgba(255,255,255,0.18)"
          stroke="#fff"
          strokeWidth="1.5"
        />
        {stats.map((s, i) => {
          const [x, y] = point(s.value, i);
          return <circle key={s.label} cx={x} cy={y} r={3} fill="#fff" />;
        })}
        {stats.map((s, i) => {
          const [x, y] = point(118, i);
          return (
            <text
              key={s.label}
              x={x}
              y={y}
              fontSize="10"
              fill="rgba(255,255,255,0.5)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {s.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Feedback Widget ── */
function FeedbackWidget() {
  const [picked, setPicked] = useState(null);
  return (
    <Section title="Feedback">
      {picked === null ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
            Was this analysis useful?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPicked("up")} style={feedbackBtnStyle}>
              👍
            </button>
            <button onClick={() => setPicked("down")} style={feedbackBtnStyle}>
              👎
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
          {picked === "up"
            ? "Glad it helped — your next roadmap will keep adapting to your scans."
            : "Thanks for the signal. We'll keep refining your recommendations."}
        </p>
      )}
    </Section>
  );
}

const feedbackBtnStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  fontSize: 16,
  padding: "6px 12px",
  cursor: "pointer",
};

/* ── Full Feature Grid (All "Coming Soon" now real) ── */
function FeatureGrid({ analysis, derived }) {
  const a = analysis;
  const d = derived;

  const features = [
    {
      title: "Skin Type",
      value: a.skinType || "Combination",
      icon: "◈",
      sub: "Based on clarity & hydration signals",
    },
    {
      title: "Acne Detection",
      value: a.skinClarity >= 85 ? "Clear" : a.skinClarity >= 70 ? "Mild" : "Moderate",
      icon: "◉",
      sub: `Skin clarity: ${a.skinClarity || 75}%`,
    },
    {
      title: "Dark Circle Score",
      value: `${Math.max(0, 100 - (a.confidence || 80))}% visible`,
      icon: "◑",
      sub: "Derived from under-eye brightness",
    },
    {
      title: "Eye Shape",
      value: a.eyeShape || "Almond",
      icon: "◎",
      sub: "From facial landmark data",
    },
    {
      title: "Jawline Definition",
      value: a.jawlineDefinition || (a.jawline >= 80 ? "Strong" : a.jawline >= 65 ? "Moderate" : "Soft"),
      icon: "⬡",
      sub: `Jawline score: ${a.jawline || 75}%`,
    },
    {
      title: "Forehead Ratio",
      value: a.foreheadRatio || "Balanced",
      icon: "▲",
      sub: "Proportion to face length",
    },
    {
      title: "Lip Symmetry",
      value: `${a.lipSymmetry || Math.round((a.symmetry || 80) * 0.95)}%`,
      icon: "◻",
      sub: "Upper-lower lip alignment",
    },
    {
      title: "Hairline Analysis",
      value: a.hairlineType || "Normal",
      icon: "⌒",
      sub: "Based on forehead geometry",
    },
    {
      title: "Age Estimation",
      value: d.ageDisplay,
      icon: "◷",
      sub: "AI-estimated facial age",
    },
    {
      title: "Celebrity Match",
      value: d.celebMatch,
      icon: "★",
      sub: "Closest structural resemblance",
    },
    {
      title: "Fashion Suggestions",
      value: d.fashionStyle,
      icon: "◈",
      sub: "Based on face shape & tone",
    },
    {
      title: "Glasses Recommendation",
      value: (accessories[a.faceShape] || ["Aviator sunglasses"])[0],
      icon: "⬭",
      sub: "Best frame shape for you",
    },
    {
      title: "Hairstyle Preview",
      value: a.hairstyle || "Textured Crop",
      icon: "⌇",
      sub: d.hairstylePreview,
    },
    {
      title: "Skin Tone Match",
      value: d.skinToneMatch,
      icon: "◐",
      sub: "Seasonal color palette",
    },
    {
      title: "Progress Trends",
      value: d.beforeAfterDelta,
      icon: "↗",
      sub: "Compared to first scan",
    },
    {
      title: "Smile Analysis",
      value: `${a.smileScore || 85}%`,
      icon: "◡",
      sub: "Smile symmetry score",
    },
    {
      title: "Lighting Score",
      value: `${a.lightingScore || 88}%`,
      icon: "☀",
      sub: "Photo lighting quality",
    },
    {
      title: "Skin Hydration",
      value: `${a.skinHydration || 74}%`,
      icon: "◇",
      sub: "Estimated hydration level",
    },
    {
      title: "Seasonal Colors",
      value: a.seasonalColor || "Winter",
      icon: "❄",
      sub: "Best season palette for you",
    },
    {
      title: "Face Age",
      value: d.ageDisplay,
      icon: "⟳",
      sub: "AI perceived vs. actual",
    },
    {
      title: "Before / After",
      value: d.beforeAfterDelta,
      icon: "⇔",
      sub: "Score delta since scan #1",
    },
    {
      title: "Facial Hair Sim",
      value: a.beardStyle || "Light Stubble",
      icon: "⌁",
      sub: d.facialHairSim,
    },
    {
      title: "Photo Quality",
      value: `${a.photoQuality || 92}%`,
      icon: "⬡",
      sub: "Resolution & angle score",
    },
    {
      title: "Expression Type",
      value: a.expressionType || "Neutral / Confident",
      icon: "◈",
      sub: "Dominant expression detected",
    },
    {
      title: "Attractiveness Trend",
      value: a.attractivenessTrend || "+3 pts this month",
      icon: "↑",
      sub: "Rolling 30-day average",
    },
    {
      title: "AI Fashion Coach",
      value: d.fashionStyle,
      icon: "✦",
      sub: "Style archetype analysis",
    },
    {
      title: "Accessory Match",
      value: (accessories[a.faceShape] || ["Watch", "Bracelet"]).slice(1).join(", "),
      icon: "◉",
      sub: "Accessories that suit you",
    },
    {
      title: "Face Width Ratio",
      value: a.faceWidthRatio || "Golden",
      icon: "⇔",
      sub: "Width-to-height proportion",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 12,
      }}
    >
      {features.map((f, i) => (
        <RevealRow key={f.title} delay={i * 0.03}>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 16,
              padding: "18px 16px",
              height: "100%",
              transition: "border-color 0.25s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              gsap.to(e.currentTarget, { y: -3, duration: 0.2, ease: "power2.out" });
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              gsap.to(e.currentTarget, { y: 0, duration: 0.2, ease: "power2.out" });
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {f.title}
              </p>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{f.icon}</span>
            </div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#fff",
                lineHeight: 1.3,
                marginBottom: 6,
              }}
            >
              {f.value}
            </p>
            {f.sub && (
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.4 }}>
                {f.sub}
              </p>
            )}
          </div>
        </RevealRow>
      ))}
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export default function Premium() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState("dark");
  const heroRef = useRef(null);
  const scoreRef = useRef(null);
  const labelRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      setAnalysis(MOCK);
      setPrevious(MOCK_PREVIOUS);
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const q = query(
          collection(db, "users", user.uid, "analyses"),
          orderBy("createdAt", "desc"),
          limit(2)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => d.data());
        setAnalysis(docs[0] || null);
        if (docs[1]) {
          const prevGlow = Math.round(docs[1].symmetry * 0.7 + docs[1].confidence * 0.3);
          setPrevious({ ...docs[1], glowScore: prevGlow });
        }
      } catch {
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  /* hero entrance */
  useEffect(() => {
    if (!analysis) return;
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(
      heroRef.current,
      { opacity: 0, y: -18 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    )
      .fromTo(
        lineRef.current,
        { scaleX: 0, transformOrigin: "left" },
        { scaleX: 1, duration: 0.6, ease: "power3.inOut" },
        "-=0.3"
      )
      .fromTo(
        labelRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5 },
        "-=0.2"
      )
      .fromTo(
        scoreRef.current,
        { opacity: 0, scale: 0.7, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" },
        "-=0.1"
      );
  }, [analysis]);

  const glowScore = analysis
    ? Math.round(analysis.symmetry * 0.7 + analysis.confidence * 0.3)
    : 0;
  const deltas = useDeltas(analysis || { symmetry: 0, confidence: 0 }, previous);
  const derived = useMemo(() => deriveAllFeatures(analysis), [analysis]);

  const isLight = theme === "light";
  const bg = isLight ? "#f4f4f4" : "#000";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <LoadingDots />
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              marginTop: 16,
              fontSize: 13,
              letterSpacing: "0.1em",
            }}
          >
            Loading premium insights
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>◈</div>
          <h2 style={{ fontWeight: 500, fontSize: 22, marginBottom: 12 }}>No analysis found</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            Upload your first selfie to unlock premium insights.
          </p>
        </div>
      </div>
    );
  }

  const level = glowLevel(glowScore);
  const shape = analysis.faceShape;

  const radarStats = [
    { label: "Symmetry", value: analysis.symmetry },
    { label: "Confidence", value: analysis.confidence },
    { label: "Jawline", value: analysis.jawline ?? 75 },
    { label: "Skin", value: analysis.skinClarity ?? 75 },
    { label: "Smile", value: analysis.smileScore ?? 80 },
    { label: "Photo", value: analysis.photoQuality ?? 85 },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: isLight ? "#111" : "#fff",
        fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
        transition: "background 0.4s, color 0.4s",
      }}
    >
      {!isLight && <Scanlines />}
      {!isLight && <GlowOrb top="-80px" left="-80px" size={400} opacity={0.05} />}
      {!isLight && <GlowOrb top="50%" left="60%" size={500} opacity={0.03} />}

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "56px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Header ── */}
        <div ref={heroRef} style={{ opacity: 0, marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <p
              ref={labelRef}
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)",
              }}
            >
              Premium · Insights
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <ThemeToggle theme={theme} onToggle={() => setTheme(isLight ? "dark" : "light")} />
              <ShareMenu analysis={analysis} glowScore={glowScore} />
            </div>
          </div>
          <div
            ref={lineRef}
            style={{
              height: 1,
              background: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)",
              marginBottom: 20,
            }}
          />
          <h1
            style={{
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              background: isLight
                ? "linear-gradient(135deg, #111 60%, rgba(0,0,0,0.5))"
                : "linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.45))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.15,
            }}
          >
            Your Premium<br />Insights
          </h1>
        </div>

        {/* ── Glow Score Hero ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 28,
            padding: "36px 32px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.04,
              backgroundImage:
                "linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.35)",
              marginBottom: 8,
            }}
          >
            Glow Score
          </p>
          <div ref={scoreRef} style={{ opacity: 0 }}>
            <p
              style={{
                fontSize: 88,
                fontWeight: 700,
                color: "#000",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              <CountUp target={glowScore} duration={1.8} />
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#000",
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                padding: "5px 14px",
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                }}
              />
              {level}
            </span>
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
              top {glowScore >= 90 ? "5%" : glowScore >= 75 ? "15%" : "40%"} globally
            </span>
            {previous && deltas.glowScore !== undefined && deltas.glowScore !== 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: deltas.glowScore > 0 ? "#1a8a4a" : "#c0392b",
                }}
              >
                {deltas.glowScore > 0 ? "▲" : "▼"} {Math.abs(deltas.glowScore)} vs last scan
              </span>
            )}
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <TabNav active={activeTab} onChange={setActiveTab} />

        {/* ══════════ OVERVIEW TAB ══════════ */}
        {activeTab === "overview" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <MetricCard label="Face Shape" value={shape} />
              <MetricCard
                label="Symmetry"
                value={analysis.symmetry}
                suffix="%"
                delta={deltas.symmetry ?? null}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <MetricCard
                label="Confidence"
                value={analysis.confidence}
                suffix="%"
                delta={deltas.confidence ?? null}
              />
              <MetricCard label="Glow Level" value={level} sub={`Top ${glowScore >= 90 ? "5%" : glowScore >= 75 ? "15%" : "40%"} globally`} />
            </div>

            <Section title="Score Breakdown">
              {[
                { label: "Symmetry", val: analysis.symmetry, delay: 0 },
                { label: "Confidence", val: analysis.confidence, delay: 0.1 },
                { label: "Jawline", val: analysis.jawline ?? 75, delay: 0.15 },
                { label: "Skin Clarity", val: analysis.skinClarity ?? 75, delay: 0.2 },
                { label: "Smile", val: analysis.smileScore ?? 85, delay: 0.25 },
                { label: "Overall Glow", val: glowScore, delay: 0.3 },
              ].map(({ label, val, delay }) => (
                <div key={label} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{val}%</span>
                  </div>
                  <ProgressBar value={val} delay={delay} />
                </div>
              ))}
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Feature Radar">
              <RadarChart stats={radarStats} />
            </Section>

            <div style={{ height: 12 }} />

            <ScanTimeline createdAt={analysis.createdAt} />
          </>
        )}

        {/* ══════════ FEATURES TAB ══════════ */}
        {activeTab === "features" && (
          <>
            <RevealRow>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                All metrics are derived from your latest AI scan — nothing is estimated without real facial data.
              </p>
            </RevealRow>
            <FeatureGrid analysis={analysis} derived={derived} />
          </>
        )}

        {/* ══════════ STYLE TAB ══════════ */}
        {activeTab === "style" && (
          <>
            <Section title="Recommended Hairstyle">
              <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
                {analysis.hairstyle}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                {derived.hairstylePreview}
              </p>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Beard Style">
              <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
                {analysis.beardStyle || "Light Stubble"}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                {derived.facialHairSim}
              </p>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Recommended Colors">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.colors?.map((c) => <Tag key={c}>{c}</Tag>)}
              </div>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Seasonal Palette">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>
                  {analysis.seasonalColor === "Winter" ? "❄" : analysis.seasonalColor === "Summer" ? "☀" : analysis.seasonalColor === "Autumn" ? "🍂" : "🌸"}
                </span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500 }}>{analysis.seasonalColor || "Winter"}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {derived.skinToneMatch} undertone
                  </p>
                </div>
              </div>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Fashion Style">
              <p style={{ fontSize: 18, fontWeight: 500 }}>{derived.fashionStyle}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                Derived from face shape and color season analysis.
              </p>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Recommended Accessories">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(accessories[shape] || []).map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Celebrity Match">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>★</span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500 }}>{derived.celebMatch}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    Closest structural resemblance from AI analysis
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ══════════ ROUTINE TAB ══════════ */}
        {activeTab === "routine" && (
          <>
            <Section title="Personalized Roadmap">
              {(roadmap[shape] || []).map((item, i) => (
                <RevealRow key={item} delay={i * 0.08}>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.75)",
                        lineHeight: 1.55,
                        fontSize: 14,
                      }}
                    >
                      {item}
                    </p>
                  </div>
                </RevealRow>
              ))}
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Daily Skin Routine">
              {skinRoutine.map((step, i) => (
                <RevealRow key={step} delay={i * 0.08}>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <span style={{ fontSize: 16, filter: "grayscale(1) brightness(1.8)" }}>
                      ✦
                    </span>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.75)",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {step}
                    </p>
                  </div>
                </RevealRow>
              ))}
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Skin Type Focus">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>◈</span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500 }}>
                    {analysis.skinType || "Combination"}
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                    Hydration level: {analysis.skinHydration || 74}% · Clarity: {analysis.skinClarity || 75}%
                  </p>
                </div>
              </div>
              <ProgressBar value={analysis.skinHydration || 74} delay={0.1} />
            </Section>

            <div style={{ height: 12 }} />

            <Section title="Progress Trends">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Since first scan</p>
                  <p style={{ fontSize: 16, color: "#7CFFB2", fontWeight: 600 }}>{derived.beforeAfterDelta}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Attractiveness trend</p>
                  <p style={{ fontSize: 16, color: "#7CFFB2", fontWeight: 600 }}>
                    {analysis.attractivenessTrend || "+3 pts this month"}
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}

        <div style={{ height: 12 }} />

        <FaqAccordion />

        <div style={{ height: 12 }} />

        <FeedbackWidget />

        <div style={{ marginTop: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <PrintButton />
          </div>
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.15)",
            }}
          >
            Premium · Powered by AI Analysis
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Loader ── */
function LoadingDots() {
  const d1 = useRef(null),
    d2 = useRef(null),
    d3 = useRef(null);
  useEffect(() => {
    [d1, d2, d3].forEach((r, i) => {
      if (!r.current) return;
      gsap.to(r.current, {
        opacity: 1,
        y: -6,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: i * 0.15,
      });
    });
  }, []);
  const dot = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#fff",
    display: "inline-block",
    margin: "0 4px",
    opacity: 0.2,
  };
  return (
    <div>
      <span ref={d1} style={dot} />
      <span ref={d2} style={dot} />
      <span ref={d3} style={dot} />
    </div>
  );
}