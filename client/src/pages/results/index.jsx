import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

import { analyzeFace } from "../../services/faceAnalysis";
import { db } from "../../firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useAuth } from "../../context/AuthContext";

export default function Results() {
    const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const backBtnRef = useRef(null);
  const selfieWrapRef = useRef(null);
  const mainCardRef = useRef(null);
  const rowRefs = useRef([]);
  const symRowRef = useRef(null);
  const barFillRef = useRef(null);
  const confArcRef = useRef(null);
  const confValRef = useRef(null);
  const symValRef = useRef(null);
  const premCardRef = useRef(null);
  const unlockBtnRef = useRef(null);
  const spinnerRef = useRef(null);

  // Loading spinner
  useEffect(() => {
    if (loading && spinnerRef.current) {
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 0.9,
        ease: "linear",
        repeat: -1,
        transformOrigin: "50% 50%",
      });
    }
  }, [loading]);

  // Results entrance
  useEffect(() => {
    if (!result || loading) return;

    const CIRCUMFERENCE = 87.96;
    const confidence = result.confidence;
    const symmetry = result.symmetry;

    const tl = gsap.timeline({ delay: 0.1, defaults: { ease: "power3.out" } });

    tl.fromTo(backBtnRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4 }
    )
    .fromTo(selfieWrapRef.current,
      { opacity: 0, scale: 0.93, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5 },
      "-=0.2"
    )
    .fromTo(mainCardRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45 },
      "-=0.25"
    )
    .fromTo(rowRefs.current,
      { opacity: 0, x: -14 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.07 },
      "-=0.2"
    )
    .fromTo(symRowRef.current,
      { opacity: 0, x: -14 },
      { opacity: 1, x: 0, duration: 0.35 },
      "-=0.3"
    )
    // Symmetry bar
    .to(barFillRef.current, {
      width: `${symmetry}%`,
      duration: 1.1,
      ease: "power2.out",
      onUpdate() {
        const pct = Math.round(parseFloat(barFillRef.current.style.width) || 0);
        if (symValRef.current) symValRef.current.textContent = `${pct}%`;
      },
    }, "-=0.25")
    // Confidence arc
    .to(confArcRef.current, {
      strokeDashoffset: CIRCUMFERENCE * (1 - confidence / 100),
      duration: 1.0,
      ease: "power2.out",
    }, "<")
    .to({ val: 0 }, {
      val: confidence,
      duration: 1.0,
      ease: "power2.out",
      onUpdate() {
        if (confValRef.current)
          confValRef.current.textContent = `${Math.round(this.targets()[0].val)}%`;
      },
    }, "<")
    // Premium card
    .fromTo(premCardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5 },
      "-=0.35"
    );
  }, [result, loading]);

  // Unlock button hover
  const handleBtnEnter = () =>
    gsap.to(unlockBtnRef.current, { scale: 1.02, duration: 0.18, ease: "power1.out" });
  const handleBtnLeave = () =>
    gsap.to(unlockBtnRef.current, { scale: 1, duration: 0.18, ease: "power1.out" });
  const handleBtnDown = () =>
    gsap.to(unlockBtnRef.current, { scale: 0.97, duration: 0.1 });
  const handleBtnUp = () =>
    gsap.to(unlockBtnRef.current, { scale: 1, duration: 0.15 });

  useEffect(() => {
    if (!state?.imageUrl) {
      navigate("/upload", { replace: true });
      return;
    }

    const img = new Image();
    img.src = state.imageUrl;

 img.onload = async () => {
  try {
    const detection = await analyzeFace(img);
    const points = detection.landmarks.positions;

    const jawWidth = points[16].x - points[0].x;
    const faceHeight = points[8].y - points[27].y;
    const ratio = jawWidth / faceHeight;

    let faceShape = "Oval";

    if (ratio > 0.9) faceShape = "Round";
    else if (ratio < 0.75) faceShape = "Long";

    const confidence = Math.round(
      detection.detection.score * 100
    );

    const nose = points[30];
    const leftEye = points[36];
    const rightEye = points[45];

    const leftDist = Math.abs(nose.x - leftEye.x);
    const rightDist = Math.abs(rightEye.x - nose.x);

    const eyeDiff = Math.abs(leftDist - rightDist);

    let symmetry = Math.max(
      50,
      Math.round(100 - eyeDiff)
    );

    symmetry = Math.min(symmetry, 98);

    const analysisResult = {
      faceShape,
      confidence,
      symmetry,

      hairstyle:
        faceShape === "Round"
          ? "Pompadour"
          : faceShape === "Long"
          ? "Textured Fringe"
          : "Textured Crop",

      beardStyle:
        faceShape === "Round"
          ? "Short Boxed Beard"
          : "Light Stubble",

      focusArea:
        faceShape === "Round"
          ? "Face definition"
          : "Jawline definition",

      colors:
        faceShape === "Round"
          ? ["Navy", "Black", "Charcoal"]
          : ["Olive", "White", "Beige"],

      
    };

    setResult(analysisResult);

    
  } catch (err) {
    console.error("Analysis error:", err);

    setResult({
      faceShape: "Unknown",
      confidence: 0,
      symmetry: 0,
      hairstyle: "Unavailable",
      focusArea: "Upload a clearer selfie",
    });
  } finally {
    setLoading(false);
  }
};
      
    img.onerror = () => setLoading(false);
  }, [state, navigate]);
useEffect(() => {
  if (!result || !user?.uid) return;

  const saveAnalysis = async () => {
    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, "analyses"),
        {
          ...result,
          createdAt: serverTimestamp(),
        }
      );

      console.log("Analysis saved:", docRef.id);
    } catch (error) {
      console.error("Failed to save analysis:", error);
    }
  };

  saveAnalysis();
}, [result, user]);
  const CIRCUMFERENCE = 87.96;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <svg
          ref={spinnerRef}
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style={{ marginBottom: 24 }}
        >
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3"
          />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeDasharray="125.6"
            strokeDashoffset="94.2"
            strokeLinecap="round"
          />
        </svg>
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>Analyzing your selfie...</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Detecting facial landmarks</p>
      </div>
    );
  }

  if (!result) return null;

  const rows = [
    { label: "Recommended hairstyle", value: result.hairstyle },
    { label: "Focus area", value: result.focusArea },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "2rem 1.5rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>

        {/* Back button */}
        <button
          ref={backBtnRef}
          onClick={() => navigate("/upload")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "rgba(255,255,255,0.4)",
            background: "none", border: "none", cursor: "pointer",
            marginBottom: 32, opacity: 0,
          }}
        >
          ← Upload another photo
        </button>

        {/* Selfie */}
        <div ref={selfieWrapRef} style={{ display: "flex", justifyContent: "center", marginBottom: 32, opacity: 0 }}>
          <div style={{
            width: 140, height: 140,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid rgba(255,255,255,0.12)",
            background: "#111",
          }}>
            <img
              src={state.imageUrl}
              alt="Your selfie"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Main card */}
        <div
          ref={mainCardRef}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 12,
            opacity: 0,
          }}
        >
          {/* Face shape row */}
          <div
            ref={(el) => (rowRefs.current[0] = el)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Face shape</span>
            <span style={{
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              borderRadius: 99,
              padding: "3px 12px",
              fontSize: 13,
              fontWeight: 500,
            }}>
              {result.faceShape}
            </span>
          </div>

          {/* Confidence row */}
          <div
            ref={(el) => (rowRefs.current[1] = el)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Detection confidence</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span ref={confValRef} style={{ fontSize: 15, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                0%
              </span>
              <svg
                width="36" height="36" viewBox="0 0 36 36"
                style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
                aria-hidden="true"
              >
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                <circle
                  ref={confArcRef}
                  cx="18" cy="18" r="14" fill="none" stroke="#fff" strokeWidth="2.5"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Symmetry row */}
          <div
            ref={symRowRef}
            style={{ padding: "1rem 1.25rem", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Facial symmetry</span>
              <span ref={symValRef} style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>0%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
              <div ref={barFillRef} style={{ height: "100%", width: "0%", background: "#fff", borderRadius: 99 }} />
            </div>
          </div>

          {/* Hairstyle + focus rows */}
          {rows.map((row, i) => (
            <div
              key={row.label}
              ref={(el) => (rowRefs.current[i + 2] = el)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: i < rows.length - 1 ? "0.5px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Premium card */}
        <div
          ref={premCardRef}
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "1.5rem 1.25rem",
            opacity: 0,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 500, color: "#000", marginBottom: "1rem" }}>
            Premium insights
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
            {["Skin analysis", "Color matching", "Personalized roadmap", "Hairstyle previews"].map((item) => (
              <div key={item} style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                🔒 {item}
              </div>
            ))}
          </div>
          <button
            ref={unlockBtnRef}
            onClick={() => navigate("/pricing")}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
            onMouseDown={handleBtnDown}
            onMouseUp={handleBtnUp}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            Unlock premium
          </button>
        </div>

      </div>
    </div>
  );
}