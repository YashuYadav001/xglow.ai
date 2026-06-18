import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { analyzeFace } from "../../services/faceAnalysis";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

gsap.registerPlugin(ScrollTrigger);

/* ─── HAIRSTYLE DATA ─── */
const HAIRSTYLE_DATA = {
  Pompadour: {
    why: "Adds vertical height to balance a wider face, drawing the eye upward and elongating your proportions.",
    traits: ["High volume on top", "Tapered sides", "Defined front sweep"],
    avoid: "Sides-only volume — widens the face further",
    maintenance: "Medium",
    length: "Medium–Long on top",
    icon: "⬆",
    productTip: "Use a strong-hold pomade for structure; matte finish for a modern feel.",
    salonTerm: "Ask for: fade on sides with disconnected length on top",
  },
  "Textured Fringe": {
    why: "A horizontal fringe visually shortens a long face, while texture adds width to create a more balanced look.",
    traits: ["Fringe across the forehead", "Textured layers", "Soft natural finish"],
    avoid: "Centre parts or no-fringe styles — accentuate length",
    maintenance: "Low",
    length: "Medium all around",
    icon: "↔",
    productTip: "Matte clay worked through damp hair for effortless texture.",
    salonTerm: "Ask for: curtain fringe with razor-cut layers",
  },
  "Textured Crop": {
    why: "Versatile and clean — works with your natural proportions without fighting them. Texture adds dimension.",
    traits: ["Short to medium length", "Natural texture", "Minimal styling required"],
    avoid: "Over-slicked looks — removes natural texture",
    maintenance: "Low",
    length: "Short–Medium",
    icon: "◻",
    productTip: "Salt spray or light wax for tousled definition with zero effort.",
    salonTerm: "Ask for: textured crop with skin fade or scissor taper",
  },
  "Side Part": {
    why: "A classic deep side part creates asymmetry that breaks up a round shape and adds a distinguished, sharp look.",
    traits: ["Deep side part", "Slicked or combed through", "Tapered or faded sides"],
    avoid: "Middle part — visually rounds the face further",
    maintenance: "Medium",
    length: "Short–Medium on top",
    icon: "↗",
    productTip: "Medium-hold pomade with shine for a clean, refined finish.",
    salonTerm: "Ask for: 1920s-inspired side part with skin fade",
  },
};

/* ─── BEARD DATA ─── */
const BEARD_DATA = {
  Round: {
    recommended: "Short Boxed Beard",
    alt: "Goatee with Angular Lines",
    why: "A shaped beard with sharper corners at the jaw and chin creates the illusion of angularity, countering the roundness of your face shape.",
    dos: [
      "Keep sides shorter, fuller on chin",
      "Sharp angular neckline — no round fade",
      "Defined cheek line, slightly low",
    ],
    donts: [
      "Full round beard — doubles the roundness",
      "Patchy growth on chin — loses definition",
    ],
    neckline: "High squared neckline, one finger above the Adam's apple",
    trimFrequency: "Every 3–4 days",
    growthPhase: "4–6 weeks to establish shape",
    productTip: "Beard oil daily to soften + define. Beard balm for shape control.",
  },
  Long: {
    recommended: "Stubble or Short Beard",
    alt: "Chin Strap",
    why: "Keeping facial hair shorter and focused on the sides adds width to a narrow face, while avoiding chin length that extends an already long face.",
    dos: [
      "Even stubble for width illusion",
      "Slightly fuller on cheeks than chin",
      "Soft rounded neckline",
    ],
    donts: [
      "Long pointed beard — elongates further",
      "Goatee only — narrows the chin area",
    ],
    neckline: "Natural rounded neckline, follow jaw angle",
    trimFrequency: "Every 2–3 days for stubble",
    growthPhase: "1–2 weeks for optimal stubble length",
    productTip: "Stubble softener daily. Light beard oil for sheen.",
  },
  Oval: {
    recommended: "Full Beard",
    alt: "Classic Short Beard",
    why: "Your balanced proportions suit almost any beard style. A full beard adds maturity and presence without fighting your natural symmetry.",
    dos: [
      "Experiment freely — most styles work",
      "Keep edges clean and defined",
      "Match beard density to hair texture",
    ],
    donts: [
      "Patchy growth without intentional shaping",
      "Ignoring neckline — undermines the whole look",
    ],
    neckline: "Clean defined neckline slightly above Adam's apple",
    trimFrequency: "Every 5–7 days for shape maintenance",
    growthPhase: "6–8 weeks for full beard",
    productTip: "Beard balm for daily shaping. Weekly conditioning mask.",
  },
};

/* ─── ROADMAP DATA ─── */
const ROADMAP_STEPS = {
  Round: [
    { phase: "Now", action: "Start growing light stubble for jaw definition" },
    { phase: "Week 2", action: "Book a hairstyle consultation for a Pompadour" },
    { phase: "Month 1", action: "Establish a skincare routine for definition" },
    { phase: "Month 2", action: "Shape your beard with angular necklines" },
  ],
  Long: [
    { phase: "Now", action: "Get a textured fringe haircut this week" },
    { phase: "Week 2", action: "Even stubble to add width to your face" },
    { phase: "Month 1", action: "Incorporate cheek-fullness exercises & hydration" },
    { phase: "Month 2", action: "Refine your look with a stylist for the season" },
  ],
  Oval: [
    { phase: "Now", action: "Experiment with a full beard — you can pull it off" },
    { phase: "Week 2", action: "Try a textured crop or side part" },
    { phase: "Month 1", action: "Lock in a consistent grooming routine" },
    { phase: "Month 2", action: "Upgrade your skincare and add a beard conditioning mask" },
  ],
};

/* ─── SCANLINES ─── */
function Scanlines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.012) 3px,rgba(255,255,255,0.012) 4px)",
      }}
    />
  );
}

/* ─── COUNT UP ─── */
function CountUp({ target, suffix = "", duration = 1.4 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof target !== "number") return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration, ease: "power2.out",
      onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
    });
  }, [target, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ─── REVEAL UP ─── */
function RevealUp({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 90%",
      onEnter: () =>
        gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, delay, ease: "power3.out" }),
    });
  }, [delay]);
  return <div ref={ref} style={{ opacity: 0, ...style }}>{children}</div>;
}

/* ─── PROGRESS BAR ─── */
function ProgressBar({ value, color = "#fff", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 92%",
      onEnter: () =>
        gsap.fromTo(el, { width: "0%" }, { width: `${value}%`, duration: 1.3, delay, ease: "power3.out" }),
    });
  }, [value, delay]);
  return (
    <div style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
      <div ref={ref} style={{ height: "100%", background: color, borderRadius: 2, width: 0 }} />
    </div>
  );
}

/* ─── TAB SWITCHER ─── */
function TabSwitcher({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 4,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, padding: 4,
      marginBottom: 20,
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1, border: "none", borderRadius: 10,
            padding: "9px 0",
            fontSize: 12, fontWeight: 600,
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.2s",
            background: active === tab ? "#fff" : "transparent",
            color: active === tab ? "#000" : "rgba(255,255,255,0.35)",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/* ─── SECTION LABEL ─── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.28)",
      marginBottom: 10,
    }}>
      {children}
    </p>
  );
}

/* ─── PILL BADGE ─── */
function Pill({ children, dark = false }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: dark ? "rgba(255,255,255,0.08)" : "#fff",
      color: dark ? "rgba(255,255,255,0.6)" : "#000",
      fontSize: 11, fontWeight: 500,
      letterSpacing: "0.05em",
      padding: "4px 12px", borderRadius: 999,
    }}>
      {children}
    </span>
  );
}

/* ─── HAIRSTYLE CARD ─── */
function HairstyleCard({ name }) {
  const data = HAIRSTYLE_DATA[name];
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 88%",
      onEnter: () =>
        gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" }),
    });
  }, []);
  if (!data) return null;

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {/* Card header — white */}
      <div style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "28px 24px 22px",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, opacity: 0.035,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.5) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)", marginBottom: 6 }}>
              Recommended Hairstyle
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 700, color: "#000", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {name}
            </h2>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#000", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}>
            {data.icon}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          <Pill>Maintenance: {data.maintenance}</Pill>
          <Pill>Length: {data.length}</Pill>
        </div>
      </div>

      {/* Why */}
      <InfoRow label="Why this works" borderTop={false}>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{data.why}</p>
      </InfoRow>

      {/* Traits */}
      <InfoRow label="Key traits">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.traits.map((t, i) => (
            <TraitRow key={t} text={t} delay={i * 0.06} />
          ))}
        </div>
      </InfoRow>

      {/* Product tip */}
      <InfoRow label="Styling product">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, marginTop: 1 }}>⬡</span>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>{data.productTip}</p>
        </div>
      </InfoRow>

      {/* Salon term */}
      <InfoRow label="What to tell your barber">
        <div style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "12px 14px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: "italic" }}>
            "{data.salonTerm}"
          </p>
        </div>
      </InfoRow>

      {/* Avoid */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: "none", borderRadius: "0 0 20px 20px",
        padding: "18px 24px",
      }}>
        <SectionLabel>What to avoid</SectionLabel>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: "rgba(255,80,80,0.7)", fontSize: 14, marginTop: 2, flexShrink: 0 }}>✕</span>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{data.avoid}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── BEARD CARD ─── */
function BeardCard({ faceShape }) {
  const data = BEARD_DATA[faceShape];
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 88%",
      onEnter: () =>
        gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" }),
    });
  }, []);
  if (!data) return null;

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {/* Header */}
      <div style={{
        background: "#111", borderRadius: "20px 20px 0 0",
        padding: "28px 24px 22px",
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle grain */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>
          Beard Style
        </p>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>
          {data.recommended}
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
          Alt: {data.alt}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill dark>Trim every {data.trimFrequency}</Pill>
          <Pill dark>Grow: {data.growthPhase}</Pill>
        </div>
      </div>

      {/* Why */}
      <InfoRow label="Why this works" borderTop={false} darkBg>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{data.why}</p>
      </InfoRow>

      {/* Do's */}
      <InfoRow label="Beard do's" darkBg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.dos.map((d, i) => (
            <div key={d} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "rgba(120,255,120,0.7)", flexShrink: 0,
              }}>✓</span>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{d}</p>
            </div>
          ))}
        </div>
      </InfoRow>

      {/* Don'ts */}
      <InfoRow label="What to avoid" darkBg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.donts.map(d => (
            <div key={d} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ color: "rgba(255,80,80,0.7)", fontSize: 14, flexShrink: 0 }}>✕</span>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{d}</p>
            </div>
          ))}
        </div>
      </InfoRow>

      {/* Neckline */}
      <InfoRow label="Neckline guide" darkBg>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 10, padding: "12px 14px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{data.neckline}</p>
        </div>
      </InfoRow>

      {/* Product */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: "none", borderRadius: "0 0 20px 20px",
        padding: "18px 24px",
      }}>
        <SectionLabel>Grooming products</SectionLabel>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, marginTop: 2, opacity: 0.5 }}>⬡</span>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{data.productTip}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── ROADMAP CARD ─── */
function RoadmapCard({ faceShape }) {
  const steps = ROADMAP_STEPS[faceShape] || ROADMAP_STEPS.Oval;
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 88%",
      onEnter: () =>
        gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" }),
    });
  }, []);

  return (
    <div ref={ref} style={{
      opacity: 0,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "24px",
    }}>
      <SectionLabel>Your Glow-Up Roadmap</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 14, position: "relative" }}>
            {/* vertical line */}
            {i < steps.length - 1 && (
              <div style={{
                position: "absolute", left: 11, top: 28,
                width: 1, bottom: -8,
                background: "rgba(255,255,255,0.08)",
              }} />
            )}
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "rgba(255,255,255,0.4)",
              }}>{i + 1}</div>
            </div>
            <div style={{ paddingBottom: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 4 }}>
                {step.phase}
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
                {step.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SHARED INFO ROW ─── */
function InfoRow({ label, children, borderTop = true, darkBg = false }) {
  return (
    <div style={{
      background: darkBg ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.035)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderTop: borderTop ? "none" : undefined,
      padding: "18px 24px",
    }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

/* ─── TRAIT ROW ─── */
function TraitRow({ text, delay }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: "top 94%",
      onEnter: () =>
        gsap.fromTo(el, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, delay, ease: "power2.out" }),
    });
  }, [delay]);
  return (
    <div ref={ref} style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0 }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0,
      }}>✓</span>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{text}</p>
    </div>
  );
}

/* ─── LOADING DOTS ─── */
function LoadingDots() {
  const refs = [useRef(null), useRef(null), useRef(null)];
  useEffect(() => {
    refs.forEach((r, i) => {
      if (!r.current) return;
      gsap.to(r.current, { opacity: 1, y: -6, duration: 0.4, repeat: -1, yoyo: true, ease: "power2.inOut", delay: i * 0.15 });
    });
  }, []);
  const dot = { width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", margin: "0 4px", opacity: 0.15 };
  return <div>{refs.map((r, i) => <span key={i} ref={r} style={dot} />)}</div>;
}

/* ─── RING PULSE ─── */
function RingPulse() {
  const r1 = useRef(null), r2 = useRef(null);
  useEffect(() => {
    [r1, r2].forEach((r, i) => {
      if (!r.current) return;
      gsap.fromTo(r.current,
        { opacity: 0.3, scale: 1 },
        { opacity: 0, scale: 1.65, duration: 2.4, delay: i * 1.2, repeat: -1, ease: "power2.out" }
      );
    });
  }, []);
  const ring = {
    position: "absolute", inset: -5, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.25)", pointerEvents: "none",
  };
  return (<><div ref={r1} style={ring} /><div ref={r2} style={ring} /></>);
}

/* ─── GRADE RING ─── */
function GradeRing({ value, label }) {
  const grade = value >= 90 ? "A" : value >= 75 ? "B" : value >= 60 ? "C" : "D";
  const color = value >= 90 ? "#7fff7f" : value >= 75 ? "#fff" : value >= 60 ? "#ffd07f" : "#ff7f7f";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 8px",
        background: `${color}12`,
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color }}>{grade}</span>
      </div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}><CountUp target={value} suffix="%" /></p>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("Hair");
  const hasSavedRef = useRef(false);

  const heroRef = useRef(null);
  const lineRef = useRef(null);
  const imgRef = useRef(null);

  /* ── analysis ── */
  useEffect(() => {
    if (!state?.imageUrl) { navigate("/upload", { replace: true }); return; }
    const run = async () => {
      try {
        const img = new Image();
        img.src = state.imageUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        const detection = await analyzeFace(img);
        if (!detection?.landmarks?.positions) throw new Error("No face detected");
        const pts = detection.landmarks.positions;
        const ratio = (pts[16].x - pts[0].x) / (pts[8].y - pts[27].y);
        const faceShape = ratio > 0.9 ? "Round" : ratio < 0.75 ? "Long" : "Oval";
        const confidence = Math.round(detection.detection.score * 100);
        const nose = pts[30], leftEye = pts[36], rightEye = pts[45];
        const symmetry = Math.min(98, Math.max(50, Math.round(100 - Math.abs(Math.abs(nose.x - leftEye.x) - Math.abs(rightEye.x - nose.x)))));
        const jawScore = faceShape === "Oval" ? 88 : faceShape === "Round" ? 72 : 80;
        const hairstyle = faceShape === "Round" ? "Pompadour" : faceShape === "Long" ? "Textured Fringe" : "Textured Crop";
        setResult({ faceShape, confidence, symmetry, jawScore, hairstyle, focusArea: faceShape === "Round" ? "Face definition" : "Jawline definition", imageUrl: state.imageUrl });
      } catch {
        setResult({ faceShape: "Oval", confidence: 82, symmetry: 78, jawScore: 80, hairstyle: "Textured Crop", focusArea: "Upload a clearer selfie", imageUrl: state.imageUrl });
      } finally { setLoading(false); }
    };
    run();
  }, [state, navigate]);

  /* ── save ── */
  useEffect(() => {
    if (!result || !user?.uid || hasSavedRef.current) return;
    hasSavedRef.current = true;
    addDoc(collection(db, "users", user.uid, "analyses"), { ...result, createdAt: serverTimestamp() })
      .catch(() => { hasSavedRef.current = false; });
  }, [result, user]);

  /* ── hero entrance ── */
  useEffect(() => {
    if (!result) return;
    const tl = gsap.timeline({ delay: 0.05 });
    tl.fromTo(heroRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
      .fromTo(lineRef.current, { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.5, ease: "power3.inOut" }, "-=0.3")
      .fromTo(imgRef.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)" }, "-=0.2");
  }, [result]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "system-ui, sans-serif" }}>
        <LoadingDots />
        <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          Analyzing your features
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#000", color: "#fff",
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
      position: "relative", overflowX: "hidden",
    }}>
      <Scanlines />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 100px", position: "relative", zIndex: 1 }}>

        {/* back */}
        <button
          onClick={() => navigate("/upload")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 13, letterSpacing: "0.06em", marginBottom: 32, padding: 0, display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
        >
          ← Upload another photo
        </button>

        {/* header */}
        <div ref={heroRef} style={{ opacity: 0, marginBottom: 36 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
            Analysis · Results
          </p>
          <div ref={lineRef} style={{ height: 1, background: "rgba(255,255,255,0.09)", marginBottom: 18 }} />
          <h1 style={{
            fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #fff 55%, rgba(255,255,255,0.35))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Your Look Report
          </h1>
        </div>

        {/* photo + face shape */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div ref={imgRef} style={{ opacity: 0, position: "relative" }}>
            <img
              src={result.imageUrl} alt="Selfie"
              style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)", display: "block" }}
            />
            <RingPulse />
          </div>
        </div>

        {/* face shape badge */}
        <RevealUp style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff", color: "#000",
            fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
            padding: "7px 18px", borderRadius: 999,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#000", display: "inline-block" }} />
            {result.faceShape} Face Shape
          </span>
        </RevealUp>

        {/* SCORE GRID */}
        <RevealUp delay={0.05} style={{ marginBottom: 16 }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20, padding: "24px 20px",
          }}>
            <SectionLabel>Analysis Scores</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <GradeRing value={result.confidence} label="Detection" />
              <GradeRing value={result.symmetry} label="Symmetry" />
              <GradeRing value={result.jawScore} label="Jaw Score" />
            </div>
            <div style={{ marginTop: 20 }}>
              {[
                { label: "Overall Confidence", value: result.confidence },
                { label: "Facial Symmetry", value: result.symmetry },
                { label: "Jaw Definition", value: result.jawScore },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{value}%</span>
                  </div>
                  <ProgressBar value={value} delay={i * 0.08} />
                </div>
              ))}
            </div>
          </div>
        </RevealUp>

        {/* focus area */}
        <RevealUp delay={0.1} style={{ marginBottom: 28 }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
              Focus area
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
              {result.focusArea}
            </span>
          </div>
        </RevealUp>

        {/* ── TAB SECTION ── */}
        <RevealUp delay={0.05} style={{ marginBottom: 8 }}>
          <TabSwitcher
            tabs={["Hair", "Beard", "Roadmap"]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </RevealUp>

        {activeTab === "Hair" && (
          <div style={{ marginBottom: 24 }}>
            <HairstyleCard name={result.hairstyle} />
          </div>
        )}

        {activeTab === "Beard" && (
          <div style={{ marginBottom: 24 }}>
            <BeardCard faceShape={result.faceShape} />
          </div>
        )}

        {activeTab === "Roadmap" && (
          <div style={{ marginBottom: 24 }}>
            <RoadmapCard faceShape={result.faceShape} />
          </div>
        )}

        {/* unlock CTA */}
        <RevealUp delay={0.05}>
          <button
            onClick={() => navigate("/pricing")}
            style={{
              width: "100%",
              background: "#fff", color: "#000",
              border: "none", borderRadius: 16,
              padding: "16px 0",
              fontSize: 15, fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2 }); e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { gsap.to(e.currentTarget, { scale: 1, duration: 0.2 }); e.currentTarget.style.boxShadow = "none"; }}
          >
            Unlock Premium Insights →
          </button>
          <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em" }}>
            Accessories · Skincare · Colour palette · Full roadmap
          </p>
        </RevealUp>

      </div>
    </div>
  );
}