import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { gsap } from "gsap";

import { auth, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function LockIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

// ─── Trait Bar ────────────────────────────────────────────────────────────────

function TraitBar({ name, value, locked = false }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (!locked && barRef.current) {
      gsap.fromTo(
        barRef.current,
        { width: "0%" },
        { width: `${value}%`, duration: 1, delay: 0.3, ease: "power2.out" }
      );
    }
  }, [value, locked]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: locked ? "transparent" : "rgba(255,255,255,0.9)",
              textShadow: locked ? "0 0 8px rgba(255,255,255,0.6)" : "none",
              filter: locked ? "blur(5px)" : "none",
              userSelect: locked ? "none" : "auto",
            }}
          >
            {value}%
          </span>
          {locked && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <LockIcon size={10} />
              Premium
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        {locked ? (
          <div
            style={{
              height: "100%",
              width: `${value}%`,
              background: "rgba(255,255,255,0.25)",
              borderRadius: 99,
              filter: "blur(3px)",
            }}
          />
        ) : (
          <div
            ref={barRef}
            style={{
              height: "100%",
              width: 0,
              background: "white",
              borderRadius: 99,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Mini Progress Chart ───────────────────────────────────────────────────────

function ProgressChart({ isPremium = false }) {
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const scores = [62, 68, 70, 74, 79, 81, 84, 86];
  const maxVal = 90;
  const visibleCount = isPremium ? 8 : 4;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
          Glow score history
        </p>
        {!isPremium && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <LockIcon size={10} />
            Full history in Premium
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          height: 72,
        }}
      >
        {weeks.map((w, i) => {
          const pct = Math.round((scores[i] / maxVal) * 100);
          const isLocked = i >= visibleCount;
          const isLatest = i === visibleCount - 1;
          return (
            <div
              key={w}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${pct}%`,
                  borderRadius: "3px 3px 0 0",
                  background: isLocked
                    ? "rgba(255,255,255,0.08)"
                    : isLatest
                    ? "white"
                    : "rgba(255,255,255,0.3)",
                  filter: isLocked ? "blur(2px)" : "none",
                  transition: "height 0.6s ease",
                  position: "relative",
                }}
              >
                {isLocked && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LockIcon size={8} />
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{w}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Premium Banner ────────────────────────────────────────────────────────────

function PremiumBanner({ onUpgrade }) {
  return (
    <div
      onClick={onUpgrade}
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 20,
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {/* Top accent stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1.5,
          background: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1), rgba(255,255,255,0.4))",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CrownIcon />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
              Unlock your full glow report
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              3 traits, trend history & global ranking locked
            </p>
          </div>
        </div>
        <button
          style={{
            background: "white",
            color: "black",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Upgrade →
        </button>
      </div>
    </div>
  );
}

// ─── Premium Features Card ─────────────────────────────────────────────────────

function PremiumFeaturesCard({ onUpgrade }) {
  const features = [
    { icon: <ChartIcon />, name: "Full trait scores", desc: "Jawline, lips, eye ratio + more" },
    { icon: <TrendUpIcon />, name: "Trend history", desc: "Track glow score over months" },
    { icon: <SparkIcon />, name: "Personalized tips", desc: "AI advice for your face type" },
    { icon: <CrownIcon />, name: "Global ranking", desc: "See where you stand" },
  ];

  return (
    <div
      style={{
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: 18,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
          What you unlock with Premium
        </p>
        <span
          style={{
            fontSize: 10,
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            padding: "3px 8px",
            borderRadius: 6,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Most popular
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {features.map((f) => (
          <div
            key={f.name}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", marginTop: 1, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                {f.name}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onUpgrade}
          style={{
            flex: 1,
            background: "white",
            color: "black",
            border: "none",
            borderRadius: 10,
            padding: "11px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Unlock Premium →
        </button>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
          From $4.99 / mo
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState([
    { label: "Analyses done", value: "0", delta: null },
    { label: "Glow score", value: "—", delta: null },
    { label: "Rank", value: "—", locked: true },
  ]);

  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium] = useState(false); // toggle this based on your auth/subscription logic

  const containerRef = useRef(null);
  const statRefs = useRef([]);
  const headerRef = useRef(null);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    const loadDashboard = async () => {
      try {
        const analysesRef = collection(db, "users", user.uid, "analyses");
        const q = query(analysesRef, orderBy("createdAt", "desc"), limit(10));
        const snapshot = await getDocs(q);

        const analyses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (analyses.length > 0) {
          const latest = analyses[0];
          setLatestAnalysis(latest);
          setStats([
            {
              label: "Analyses done",
              value: analyses.length.toString(),
              delta: "+2 this week",
            },
            {
              label: "Glow score",
              value: latest.symmetry ? `${latest.symmetry}%` : "—",
              delta: "+3 pts",
            },
            {
              label: "Rank",
              value: "Top 12%",
              locked: !isPremium,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, isPremium]);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );

      gsap.fromTo(
        bannerRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: "power2.out" }
      );

      const els = statRefs.current.filter(Boolean);
      gsap.fromTo(
        els,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, delay: 0.15, stagger: 0.07, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  // Trait data — locked ones only show with Premium
  const traits = [
    { name: "Symmetry", value: latestAnalysis?.symmetry || 87, locked: false },
    { name: "Skin clarity", value: 72, locked: false },
    { name: "Jawline definition", value: 91, locked: !isPremium },
    { name: "Eye ratio", value: 78, locked: !isPremium },
    { name: "Lip proportion", value: 83, locked: !isPremium },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white px-5 py-9"
    >
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div ref={headerRef} className="mb-7" style={{ opacity: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 6,
                }}
              >
                Welcome back
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 500, marginBottom: 4 }}>
                {user?.displayName || user?.email}
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Track your glow-up journey over time.
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                cursor: "pointer",
              }}
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </div>

        {/* Premium Banner */}
        {!isPremium && (
          <div ref={bannerRef} style={{ opacity: 0 }}>
            <PremiumBanner onUpgrade={handleUpgrade} />
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              ref={(el) => (statRefs.current[index] = el)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "14px 14px",
                opacity: 0,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  filter: stat.locked ? "blur(6px)" : "none",
                  userSelect: stat.locked ? "none" : "auto",
                  color: "white",
                  marginBottom: stat.delta ? 4 : 0,
                }}
              >
                {stat.value}
              </p>
              {stat.locked ? (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    cursor: "pointer",
                  }}
                  onClick={handleUpgrade}
                >
                  <LockIcon size={9} />
                  Premium only
                </p>
              ) : stat.delta ? (
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <TrendUpIcon />
                  {stat.delta}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => navigate("/upload")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "white",
              color: "black",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <CameraIcon />
            Upload selfie
          </button>

          <button
            onClick={() => navigate("/progress")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
            }}
          >
            <ChartIcon />
            View progress
          </button>

          <button
            onClick={handleUpgrade}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
            }}
          >
            <SparkIcon />
            Get tips
          </button>
        </div>

        {/* Trait Breakdown */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 12,
          }}
        >
          Trait breakdown
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
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
            <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
              Face analysis
            </p>
            <span
              style={{
                fontSize: 10,
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              Latest
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Loading...</p>
            ) : (
              traits.map((t) => (
                <TraitBar key={t.name} name={t.name} value={t.value} locked={t.locked} />
              ))
            )}
          </div>
        </div>

        {/* Progress Chart */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 12,
          }}
        >
          Progress
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <ProgressChart isPremium={isPremium} />
        </div>

        {/* Recent Analysis */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 12,
          }}
        >
          Recent analysis
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
          }}
        >
          {loading ? (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Loading...</p>
          ) : latestAnalysis ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                { label: "Face shape", value: latestAnalysis.faceShape },
                { label: "Hairstyle", value: latestAnalysis.hairstyle },
                { label: "Symmetry", value: `${latestAnalysis.symmetry}%` },
                { label: "Focus area", value: latestAnalysis.focusArea },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "rgba(255,255,255,0.3)",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              Your analysis history will appear here after your first upload.
            </p>
          )}
        </div>

        {/* Premium features upsell */}
        {!isPremium && <PremiumFeaturesCard onUpgrade={handleUpgrade} />}

      </div>
    </div>
  );
}