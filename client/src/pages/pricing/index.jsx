import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";
import { gsap } from "gsap";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES_FREE = [
  "Basic symmetry score",
  "Face shape detection",
  "1 analysis per week",
];

const FEATURES_PREMIUM = [
  { icon: <HairIcon />,     label: "Personalized hairstyle suggestions" },
  { icon: <SkinIcon />,     label: "Skincare recommendations" },
  { icon: <PaletteIcon />,  label: "Color analysis report" },
  { icon: <RoadmapIcon />,  label: "Weekly improvement roadmap" },
  { icon: <ChartIcon />,    label: "Progress tracking over time" },
  { icon: <JawIcon />,      label: "Jawline, eye & lip scoring" },
  { icon: <StarIcon />,     label: "Global glow ranking" },
  { icon: <TipIcon />,      label: "AI-personalized daily tips" },
];

const TESTIMONIALS = [
  { name: "Priya S.", text: "My score went from 71% to 88% in 6 weeks following the roadmap.", avatar: "PS" },
  { name: "Marcus L.", text: "The color analysis alone was worth it. Never knew my undertone.", avatar: "ML" },
  { name: "Aanya R.", text: "Finally understand what hairstyles actually suit my face shape.", avatar: "AR" },
];

// ─── Animated counter ─────────────────────────────────────────────────────────

function CountUp({ to, suffix = "", duration = 1.4 }) {
  const ref = useRef(null);
  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: to,
      duration,
      ease: "power2.out",
      delay: 0.6,
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString() + suffix;
      },
    });
  }, [to, duration, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

// ─── Comparison toggle ────────────────────────────────────────────────────────

function ComparisonTable() {
  return (
    <div
      style={{
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 80px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ padding: "10px 14px" }} />
        <div
          style={{
            padding: "10px 0",
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Free
        </div>
        <div
          style={{
            padding: "10px 0",
            textAlign: "center",
            fontSize: 11,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          Premium
        </div>
      </div>
      {[
        ["Analyses per week", "1", "Unlimited"],
        ["Trait scores", "1", "8"],
        ["Skincare tips", "✕", "✓"],
        ["Color analysis", "✕", "✓"],
        ["Hairstyle guide", "✕", "✓"],
        ["Progress chart", "✕", "✓"],
        ["Global ranking", "✕", "✓"],
      ].map(([label, free, premium], i) => (
        <div
          key={label}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px",
            borderBottom: i < 6 ? "0.5px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          <div style={{ padding: "9px 14px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            {label}
          </div>
          <div
            style={{
              padding: "9px 0",
              textAlign: "center",
              fontSize: 12,
              color: free === "✕" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
            }}
          >
            {free}
          </div>
          <div
            style={{
              padding: "9px 0",
              textAlign: "center",
              fontSize: 12,
              color: premium === "✕" ? "rgba(255,255,255,0.2)" : "white",
              background: "rgba(255,255,255,0.03)",
              fontWeight: premium !== "✕" ? 500 : 400,
            }}
          >
            {premium}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────

function TestimonialCard({ name, text, avatar, refEl }) {
  return (
    <div
      ref={refEl}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "14px 16px",
        opacity: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            flexShrink: 0,
          }}
        >
          {avatar}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{name}</p>
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>"{text}"</p>
    </div>
  );
}

// ─── Urgency ticker ───────────────────────────────────────────────────────────

function UrgencyBadge() {
  const [count] = useState(Math.floor(Math.random() * 8) + 14);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 20,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.5)",
          animation: "pulse 2s infinite",
        }}
      />
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
        {count} people started their trial in the last hour
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ─── Main Pricing ─────────────────────────────────────────────────────────────

export default function Pricing() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef   = useRef(null);
  const badgeRef       = useRef(null);
  const headingRef     = useRef(null);
  const subRef         = useRef(null);
  const statsRowRef    = useRef(null);
  const featureRefs    = useRef([]);
  const priceCardRef   = useRef(null);
  const primaryBtnRef  = useRef(null);
  const ghostBtnRef    = useRef(null);
  const trustRef       = useRef(null);
  const testimonialRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = [
        badgeRef.current,
        headingRef.current,
        subRef.current,
        statsRowRef.current,
        ...featureRefs.current,
        priceCardRef.current,
        primaryBtnRef.current,
        ghostBtnRef.current,
        trustRef.current,
      ].filter(Boolean);

      gsap.set(els, { opacity: 0, y: 20 });
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.06,
      });

      // Testimonials
      gsap.to(testimonialRefs.current.filter(Boolean), {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        delay: 0.7,
        ease: "power2.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleFeatureHover = (i, entering) => {
    setHovered(entering ? i : null);
    gsap.to(featureRefs.current[i], {
      x: entering ? 5 : 0,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handlePrimary = async () => {
    if (loading) return;
    gsap.to(primaryBtnRef.current, {
      scale: 0.97,
      duration: 0.1,
      ease: "power2.in",
      onComplete: async () => {
        gsap.to(primaryBtnRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (!user) { navigate("/login"); return; }
          await updateDoc(doc(db, "users", user.uid), { isPremium: true });
          navigate("/premium");
        } catch (error) {
          console.error(error);
          alert("Failed to activate premium.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleLater = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      y: 16,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => navigate("/dashboard"),
    });
  };

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ padding: "40px 20px 60px" }}
    >
      <div ref={containerRef} style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>

        {/* Badge */}
        <div ref={badgeRef} style={{ display: "flex", justifyContent: "center", marginBottom: 24, opacity: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 99,
              padding: "5px 14px",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              Premium
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1
            ref={headingRef}
            style={{ fontSize: 30, fontWeight: 500, color: "white", marginBottom: 8, opacity: 0 }}
          >
            Unlock your full glow-up
          </h1>
          <p
            ref={subRef}
            style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, opacity: 0 }}
          >
            Your free analysis only scratches the surface.
            <br />Here's what you're missing.
          </p>
        </div>

        {/* Social proof stats */}
        <div
          ref={statsRowRef}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 24,
            opacity: 0,
          }}
        >
          {[
            { value: 800, suffix: "+", label: "Members" },
            { value: 4.9, suffix: "★", label: "Avg rating", fixed: 1 },
            { value: 89, suffix: "%", label: "See results" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 8px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: 500, color: "white", marginBottom: 2 }}>
                <CountUp to={s.value} suffix={s.suffix} duration={1.2} />
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {FEATURES_PREMIUM.map((f, i) => (
            <div
              key={f.label}
              ref={(el) => (featureRefs.current[i] = el)}
              onMouseEnter={() => handleFeatureHover(i, true)}
              onMouseLeave={() => handleFeatureHover(i, false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 12,
                border: "0.5px solid rgba(255,255,255,0.07)",
                background: hovered === i ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                cursor: "default",
                transition: "background 0.2s",
                opacity: 0,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", flex: 1 }}>{f.label}</span>
              <CheckIcon />
            </div>
          ))}
        </div>

        {/* Compare free vs premium toggle */}
        <button
          onClick={() => setShowComparison((v) => !v)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            marginBottom: showComparison ? 14 : 20,
            padding: "4px 0",
          }}
        >
          <span>{showComparison ? "Hide" : "Compare"} free vs premium</span>
          <svg
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ transform: showComparison ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showComparison && <ComparisonTable />}

        {/* Price card */}
        <div
          ref={priceCardRef}
          style={{
            borderRadius: 16,
            border: "0.5px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            padding: "20px 22px",
            marginBottom: 14,
            opacity: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle top stripe */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1.5,
              background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1), rgba(255,255,255,0.4))",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>
              Monthly plan
            </p>
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: 99,
                padding: "3px 10px",
              }}
            >
              7-day free trial
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 44, fontWeight: 500, color: "white", letterSpacing: "-0.02em" }}>$4.99</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>/ month</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            Cancel anytime. No questions asked.
          </p>
        </div>

        {/* Urgency */}
        <UrgencyBadge />

        {/* CTA */}
        <button
          ref={primaryBtnRef}
          onClick={handlePrimary}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 0",
            background: loading ? "rgba(255,255,255,0.7)" : "white",
            color: "black",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 10,
            opacity: 0,
            transition: "background 0.15s",
          }}
        >
          {loading ? "Activating…" : "Start free trial →"}
        </button>

        <button
          ref={ghostBtnRef}
          onClick={handleLater}
          style={{
            width: "100%",
            padding: "13px 0",
            background: "none",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            marginBottom: 24,
            opacity: 0,
          }}
        >
          Maybe later
        </button>

        {/* Trust signals */}
        <div
          ref={trustRef}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            marginBottom: 28,
            opacity: 0,
          }}
        >
          {[
            { icon: <ShieldIcon />, label: "Secure payment" },
            { icon: <LockIcon />,   label: "Privacy first" },
            { icon: <RefundIcon />, label: "7-day refund" },
          ].map((t) => (
            <div
              key={t.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.25)" }}>{t.icon}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          What members say
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard
              key={t.name}
              name={t.name}
              text={t.text}
              avatar={t.avatar}
              refEl={(el) => (testimonialRefs.current[i] = el)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function HairIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function SkinIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}
function RoadmapIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}
function JawIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}
function TipIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function RefundIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}