import { useEffect, useMemo, useRef, useState } from "react";
import { forwardRef } from "react";
import {
  collection, getDocs, orderBy, query,
} from "firebase/firestore";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip,
} from "recharts";
import { gsap } from "gsap";

import { db }      from "../../firebase";
import { useAuth } from "../../context/AuthContext";

/* ─── Design tokens ──────────────────────────────────────────────────────
   Direction: "lab readout / contact sheet" — black & white, no accent color.
   Numbers live in mono (measured data), labels live in a wide tracked sans
   (editorial voice). The signature element is the horizontal measurement
   strip + the contact-sheet index list, echoing photographic analysis
   rather than a generic SaaS dashboard.
──────────────────────────────────────────────────────────────────────── */
const T = {
  bg:        "#000000",
  surface:   "#0d0d0d",
  surfaceHi: "#141414",
  line:      "#232323",
  lineHi:    "#3a3a3a",
  white:     "#f5f5f3",
  bone:      "#e8e3d8",
  muted:     "rgba(245,245,243,0.42)",
  faint:     "rgba(245,245,243,0.16)",
  sans:      "'Helvetica Neue', Arial, sans-serif",
  mono:      "'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace",
};

export default function Progress() {
  const { user } = useAuth();

  const [analyses, setAnalyses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* ── GSAP refs ─────────────────────────────────────────────────────── */
  const pageRef     = useRef(null);
  const headerRef   = useRef(null);
  const scanRef     = useRef(null);
  const statsRef    = useRef([]);
  const chartRef    = useRef(null);
  const historyRef  = useRef(null);
  const spinnerRef  = useRef(null);

  statsRef.current = [];
  const addStat = (el) => { if (el) statsRef.current.push(el); };

  /* ── Load data ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }

    const loadAnalyses = async () => {
      try {
        const ref      = collection(db, "users", user.uid, "analyses");
        const q        = query(ref, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setAnalyses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load analyses:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyses();
  }, [user]);

  /* ── Derived data ──────────────────────────────────────────────────── */
  const latest = analyses[0];

  const averageSymmetry = useMemo(() => {
    if (!analyses.length) return "—";
    const total = analyses.reduce((s, a) => s + (a.symmetry || 0), 0);
    return `${Math.round(total / analyses.length)}%`;
  }, [analyses]);

  const bestSymmetry = useMemo(() => {
    if (!analyses.length) return "—";
    const best = Math.max(...analyses.map((a) => a.symmetry || 0));
    return `${best}%`;
  }, [analyses]);

  const chartData = useMemo(() =>
    [...analyses].reverse().map((a) => ({
      date:     a.createdAt?.toDate?.().toLocaleDateString() || "Today",
      symmetry: a.symmetry || 0,
    })),
  [analyses]);

  /* ── Spinner GSAP ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!loading || !spinnerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(spinnerRef.current, { rotation: 360, duration: 1.1, repeat: -1, ease: "none" });
    });
    return () => ctx.revert();
  }, [loading]);

  /* ── Entrance GSAP ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(pageRef.current,
        { opacity: 0 }, { opacity: 1, duration: 0.4 })
      .fromTo(headerRef.current,
        { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.15");

      // signature scan-line sweep across the measurement strip
      if (scanRef.current) {
        tl.fromTo(scanRef.current,
          { xPercent: -100, opacity: 0.9 },
          { xPercent: 220, opacity: 0, duration: 0.9, ease: "power2.inOut" },
          "-=0.3"
        );
      }

      tl.fromTo(statsRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, "-=0.7");

      if (chartRef.current) {
        tl.fromTo(chartRef.current,
          { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, "-=0.25");
      }

      if (historyRef.current) {
        tl.fromTo(
          Array.from(historyRef.current.children),
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 },
          "-=0.3"
        );
      }
    }, pageRef);

    return () => ctx.revert();
  }, [loading, analyses]);

  /* ─────────────────────────────────────────────────────────────────── */
  /* LOADING                                                              */
  if (loading) return (
    <div style={{
      minHeight: "100dvh", background: T.bg, color: T.white,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
      fontFamily: T.sans,
    }}>
      <div ref={spinnerRef} style={{
        width: 40, height: 40, borderRadius: "50%",
        border: `1px solid ${T.line}`, borderTopColor: T.white,
      }} />
      <p style={{
        color: T.muted, fontSize: 11, margin: 0,
        fontFamily: T.mono, letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        Reading samples…
      </p>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────── */
  /* MAIN                                                                 */
  return (
    <div
      ref={pageRef}
      style={{
        minHeight: "100dvh", background: T.bg, color: T.white,
        padding: "40px 20px 64px", fontFamily: T.sans,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div
          ref={headerRef}
          style={{
            marginBottom: 36,
            paddingBottom: 22,
            borderBottom: `1px solid ${T.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{
              fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
              color: T.muted, margin: "0 0 12px", fontFamily: T.mono,
            }}>
              Progress · Index
            </p>
            <h1 style={{
              fontSize: 32, fontWeight: 700, margin: 0,
              letterSpacing: "-0.01em", lineHeight: 1.05,
            }}>
              Your Glow-Up Journey
            </h1>
          </div>
          <p style={{
            color: T.muted, fontSize: 12, margin: 0,
            fontFamily: T.mono, textAlign: "right", lineHeight: 1.6,
          }}>
            {analyses.length} {analyses.length === 1 ? "sample" : "samples"} logged<br/>
            since {analyses.length ? (analyses[analyses.length - 1].createdAt?.toDate?.().toLocaleDateString() || "today") : "—"}
          </p>
        </div>

        {/* Measurement strip (signature element) */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: T.surface,
            border: `1px solid ${T.line}`,
            borderRadius: 4,
            marginBottom: 28,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {/* scan sweep, decorative only */}
          <div
            ref={scanRef}
            style={{
              position: "absolute", top: 0, bottom: 0, left: 0,
              width: "30%",
              background: "linear-gradient(90deg, transparent, rgba(245,245,243,0.06), transparent)",
              pointerEvents: "none",
            }}
          />
          <StatCard ref={addStat} index="01" label="Analyses done"    value={analyses.length} />
          <StatCard ref={addStat} index="02" label="Avg. symmetry"    value={averageSymmetry} sub={`peak ${bestSymmetry}`} />
          <StatCard ref={addStat} index="03" label="Latest shape"     value={latest?.faceShape || "—"} />
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div
            ref={chartRef}
            style={{
              background: T.surface, border: `1px solid ${T.line}`,
              borderRadius: 4, padding: "26px 22px 14px",
              marginBottom: 28,
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "baseline", marginBottom: 4,
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: "0.01em" }}>
                Symmetry trend
              </p>
              <p style={{
                fontSize: 11, color: T.muted, margin: 0,
                fontFamily: T.mono, letterSpacing: "0.05em",
              }}>
                0–100 SCALE
              </p>
            </div>
            <p style={{ fontSize: 12, color: T.muted, margin: "0 0 18px" }}>
              Score recorded at each analysis, in chronological order.
            </p>

            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#555", fontSize: 11, fontFamily: T.mono }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fill: "#555", fontSize: 11, fontFamily: T.mono }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#141414",
                      border: `1px solid ${T.line}`,
                      borderRadius: 4,
                      color: T.white,
                      fontSize: 12,
                      fontFamily: T.mono,
                    }}
                    labelStyle={{ color: T.muted }}
                    cursor={{ stroke: T.lineHi, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="symmetry"
                    stroke={T.white}
                    strokeWidth={1.75}
                    dot={{ r: 3, fill: T.white, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: T.bone, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          margin: "0 0 14px",
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, margin: 0,
            letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted,
            fontFamily: T.mono,
          }}>
            Analysis history
          </p>
          {analyses.length > 0 && (
            <p style={{
              fontSize: 11, margin: 0, color: T.faint,
              fontFamily: T.mono, letterSpacing: "0.05em",
            }}>
              {String(analyses.length).padStart(2, "0")} ENTRIES
            </p>
          )}
        </div>

        {/* Empty state */}
        {analyses.length === 0 ? (
          <div style={{
            background: T.surface, border: `1px dashed ${T.lineHi}`,
            borderRadius: 4, padding: "32px 26px",
            color: T.muted, fontSize: 14, lineHeight: 1.6,
          }}>
            No analyses yet — upload your first selfie to start the index.
          </div>
        ) : (
          <div ref={historyRef} style={{ display: "flex", flexDirection: "column" }}>
            {analyses.map((a, i) => (
              <HistoryCard
                key={a.id}
                analysis={a}
                index={analyses.length - i}
                isFirst={i === 0}
                isLast={i === analyses.length - 1}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────── */
const StatCard = forwardRef(function StatCard({ index, label, value, sub }, ref) {
  return (
    <div
      ref={ref}
      style={{
        padding: "20px 20px 18px",
        borderRight: `1px solid ${T.line}`,
        position: "relative",
      }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "baseline", marginBottom: 14,
      }}>
        <p style={{
          fontSize: 10, color: T.faint, margin: 0,
          fontFamily: T.mono, letterSpacing: "0.1em",
        }}>
          {index}
        </p>
        <p style={{
          fontSize: 10, color: T.muted, margin: 0,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {label}
        </p>
      </div>
      <p style={{
        fontSize: 27, fontWeight: 600, margin: 0,
        letterSpacing: "-0.02em", fontFamily: T.mono,
        color: T.bone,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: 11, color: T.muted, margin: "5px 0 0",
          fontFamily: T.mono,
        }}>
          {sub}
        </p>
      )}
    </div>
  );
});

/* ─── HistoryCard ───────────────────────────────────────────────────── */
function HistoryCard({ analysis, index, isFirst, isLast }) {
  const ref = useRef(null);

  const handleEnter = () => gsap.to(ref.current, {
    background: T.surfaceHi, duration: 0.2, ease: "power2.out",
  });
  const handleLeave = () => gsap.to(ref.current, {
    background: "transparent", duration: 0.2, ease: "power2.out",
  });

  const dateStr = analysis.createdAt?.toDate?.().toLocaleDateString() || "Today";

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        borderTop: isFirst ? `1px solid ${T.line}` : "none",
        borderBottom: `1px solid ${T.line}`,
        padding: "18px 14px",
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        alignItems: "center",
        gap: 16,
        borderRadius: 2,
      }}
    >
      {/* Index number — contact-sheet style */}
      <span style={{
        fontFamily: T.mono, fontSize: 13, color: T.faint,
        letterSpacing: "0.02em",
      }}>
        {String(index).padStart(2, "0")}
      </span>

      {/* Main info */}
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{analysis.faceShape}</span>
          {isFirst && (
            <span style={{
              fontSize: 9, fontFamily: T.mono, letterSpacing: "0.08em",
              color: T.bone, border: `1px solid ${T.lineHi}`,
              borderRadius: 20, padding: "2px 8px",
            }}>
              LATEST
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", maxWidth: 360 }}>
          <Field label="Confidence" value={`${analysis.confidence}%`} />
          <Field label="Symmetry"   value={`${analysis.symmetry}%`} />
          <Field label="Hairstyle"  value={analysis.hairstyle} />
          <Field label="Focus area" value={analysis.focusArea} />
        </div>
      </div>

      {/* Date, right aligned */}
      <span style={{
        fontFamily: T.mono, fontSize: 11, color: T.muted,
        whiteSpace: "nowrap", alignSelf: "start",
      }}>
        {dateStr}
      </span>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{
        fontSize: 10, color: T.faint, margin: "0 0 3px",
        textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: T.mono,
      }}>
        {label}
      </p>
      <p style={{ fontSize: 13, margin: 0, color: "rgba(245,245,243,0.82)" }}>
        {value}
      </p>
    </div>
  );
}