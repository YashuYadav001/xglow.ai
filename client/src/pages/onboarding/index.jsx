import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import questions from "../../assets/questions";

const LETTERS = ["A", "B", "C", "D", "E"];

/* ── ambient orb ── */
function Orb({ top, left, size, color }) {
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
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}


/* ── scanline overlay ── */
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
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ── dot progress ── */
function ProgressDots({ current, total }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: isDone || isActive ? "#fff" : "rgba(255,255,255,0.15)",
              transform: isActive ? "scale(1.4)" : "scale(1)",
              transition: "background 0.3s, transform 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

/* ── option button ── */
function OptionBtn({ letter, text, selected, onClick, delay }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4, delay, ease: "power3.out" }
    );
  }, [delay]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        opacity: 0,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        background: selected ? "#fff" : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? "#fff" : "rgba(255,255,255,0.09)"}`,
        borderRadius: 16,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        color: selected ? "#000" : "rgba(255,255,255,0.75)",
        fontSize: 14,
        fontFamily: "inherit",
        fontWeight: 400,
        letterSpacing: "0.01em",
        transition: "background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s",
        transform: selected ? "translateX(4px)" : "translateX(0)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
          e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          e.currentTarget.style.transform = "translateX(0)";
        }
      }}
    >
      {/* letter badge */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: selected ? "#000" : "rgba(255,255,255,0.35)",
          background: selected ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${selected ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 7,
          padding: "4px 8px",
          minWidth: 28,
          textAlign: "center",
          transition: "all 0.2s",
        }}
      >
        {letter}
      </span>

      <span style={{ flex: 1 }}>{text}</span>

      {/* checkmark */}
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: selected ? 1 : 0,
          transition: "opacity 0.2s",
          flexShrink: 0,
        }}
      >
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

/* ══════════════════════════════
   MAIN COMPONENT
══════════════════════════════ */
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const questionWrapRef = useRef(null);
  const nextBtnRef = useRef(null);
  const cardRef = useRef(null);

  const current = questions[step];
  const pct = ((step + 1) / questions.length) * 100;
  const hasAnswer = !!answers[current?.id];

  /* ── entrance animation ── */
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
  }, []);

  /* ── question transition ── */
  const animateQuestion = (cb) => {
    if (!questionWrapRef.current) { cb(); return; }
    gsap.to(questionWrapRef.current, {
      opacity: 0,
      y: -14,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        cb();
        gsap.fromTo(
          questionWrapRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
        );
      },
    });
  };

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  };

  const handleNext = () => {
    if (!hasAnswer) return;

    if (step === questions.length - 1) {
      localStorage.setItem("onboardingAnswers", JSON.stringify(answers));
      gsap.to(cardRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
          setDone(true);
          gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
          );
        },
      });
      return;
    }

    animateQuestion(() => setStep((s) => s + 1));
  };

  /* ── done screen ── */
  if (done) {
    return (
      <div style={rootStyle}>
        <Scanlines />
        <Orb top="-100px" left="-80px" size="320px" color="rgba(120,80,255,0.12)" />
        <Orb top="60%" left="65%" size="280px" color="rgba(80,200,255,0.08)" />
        <div ref={cardRef} style={{ ...cardStyle, textAlign: "center", padding: "48px 32px" }}>
          <div style={doneIconStyle}>✦</div>
          <h2 style={doneTitleStyle}>You're all set</h2>
          <p style={doneSubStyle}>
            Your profile is ready. Upload your first selfie<br />
            to unlock your Glow Score.
          </p>
          <button
  onClick={() => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/login");
  }}
            style={{ ...nextBtnActiveStyle, maxWidth: 260, margin: "0 auto" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.015)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Start scanning →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <Scanlines />
      <Orb top="-100px" left="-80px" size="320px" color="rgba(120,80,255,0.12)" />
      <Orb top="60%" left="65%" size="280px" color="rgba(80,200,255,0.08)" />

      <div ref={cardRef} style={cardStyle}>

        {/* ── top bar ── */}
        <div style={topBarStyle}>
          <span style={logoStyle}>xGlow</span>
          <span style={stepBadgeStyle}>
            {step + 1} of {questions.length}
          </span>
        </div>

        {/* ── progress ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={progressTrackStyle}>
            <div style={{ ...progressFillStyle, width: `${pct}%` }} />
          </div>
          <ProgressDots current={step} total={questions.length} />
        </div>

        {/* ── question ── */}
        <div ref={questionWrapRef} style={{ marginBottom: "2rem" }}>
          <p style={eyebrowStyle}>
            {current.eyebrow || "Personalize your analysis"}
          </p>
          <h1 style={questionTitleStyle}>{current.title}</h1>
        </div>

        {/* ── options ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.75rem" }}>
          {current.options.map((option, i) => (
            <OptionBtn
              key={`${step}-${option}`}
              letter={LETTERS[i]}
              text={option}
              selected={answers[current.id] === option}
              onClick={() => handleSelect(option)}
              delay={i * 0.07}
            />
          ))}
        </div>

        {/* ── next button ── */}
        <button
          ref={nextBtnRef}
          onClick={handleNext}
          disabled={!hasAnswer}
          style={hasAnswer ? nextBtnActiveStyle : nextBtnInactiveStyle}
          onMouseEnter={(e) => {
            if (hasAnswer) e.currentTarget.style.transform = "scale(1.015)";
          }}
          onMouseLeave={(e) => {
            if (hasAnswer) e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={(e) => {
            if (hasAnswer) e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            if (hasAnswer) e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span>{step === questions.length - 1 ? "Continue" : "Next"}</span>
          <span style={{ transition: "transform 0.2s" }}>→</span>
        </button>

      </div>
    </div>
  );
}

/* ── static styles ── */
const rootStyle = {
  minHeight: "100vh",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1.5rem",
  fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif",
  position: "relative",
  overflow: "hidden",
};

const cardStyle = {
  width: "100%",
  maxWidth: 420,
  position: "relative",
  zIndex: 1,
  opacity: 0,
};

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "2rem",
};

const logoStyle = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.9)",
};

const stepBadgeStyle = {
  fontSize: 11,
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 999,
  padding: "4px 12px",
};

const progressTrackStyle = {
  height: 2,
  background: "rgba(255,255,255,0.08)",
  borderRadius: 2,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "#fff",
  borderRadius: 2,
  transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
};

const eyebrowStyle = {
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.3)",
  marginBottom: 10,
};

const questionTitleStyle = {
  fontSize: 26,
  fontWeight: 500,
  color: "#fff",
  lineHeight: 1.25,
  letterSpacing: "-0.02em",
};

const nextBtnBase = {
  width: "100%",
  padding: "16px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.04em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "transform 0.15s, opacity 0.25s",
};

const nextBtnActiveStyle = {
  ...nextBtnBase,
  background: "#fff",
  color: "#000",
};

const nextBtnInactiveStyle = {
  ...nextBtnBase,
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.25)",
  cursor: "not-allowed",
  border: "1px solid rgba(255,255,255,0.08)",
};

const doneIconStyle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 1.5rem",
  fontSize: 24,
  color: "#000",
};

const doneTitleStyle = {
  fontSize: 28,
  fontWeight: 500,
  color: "#fff",
  letterSpacing: "-0.02em",
  marginBottom: "0.5rem",
};

const doneSubStyle = {
  fontSize: 14,
  color: "rgba(255,255,255,0.4)",
  lineHeight: 1.7,
  marginBottom: "2rem",
};