import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";

import { auth, db } from "../../firebase";
import { gsap } from "gsap";

const FEATURES = [
  { icon: <HairIcon />,     label: "Personalized hairstyle suggestions" },
  { icon: <SkinIcon />,     label: "Skincare recommendations" },
  { icon: <PaletteIcon />,  label: "Color analysis report" },
  { icon: <RoadmapIcon />,  label: "Weekly improvement roadmap" },
  { icon: <ChartIcon />,    label: "Progress tracking" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const containerRef  = useRef(null);
  const badgeRef      = useRef(null);
  const headingRef    = useRef(null);
  const subRef        = useRef(null);
  const featureRefs   = useRef([]);
  const priceCardRef  = useRef(null);
  const primaryBtnRef = useRef(null);
  const ghostBtnRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = [
        badgeRef.current,
        headingRef.current,
        subRef.current,
        ...featureRefs.current,
        priceCardRef.current,
        primaryBtnRef.current,
        ghostBtnRef.current,
      ];
      gsap.set(els, { opacity: 0, y: 22 });
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.07,
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
  gsap.to(primaryBtnRef.current, {
    scale: 0.97,
    duration: 0.1,
    ease: "power2.in",

    onComplete: async () => {
      gsap.to(primaryBtnRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      });

      try {
        const user = auth.currentUser;

        if (!user) {
          navigate("/login");
          return;
        }

        await updateDoc(
          doc(db, "users", user.uid),
          {
            isPremium: true,
          }
        );

        navigate("/premium");
      } catch (error) {
        console.error(error);
        alert("Failed to activate premium.");
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div ref={containerRef} className="w-full max-w-sm">

        {/* Badge */}
        <div ref={badgeRef} className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <span className="text-xs tracking-widest uppercase text-white/35">Premium</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 ref={headingRef} className="text-3xl font-medium text-white mb-2">
            Unlock your glow-up
          </h1>
          <p ref={subRef} className="text-sm text-white/40">
            Get your complete personalized analysis.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              ref={(el) => (featureRefs.current[i] = el)}
              onMouseEnter={() => handleFeatureHover(i, true)}
              onMouseLeave={() => handleFeatureHover(i, false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 bg-white/3 cursor-default transition-colors duration-200"
              style={{ background: hovered === i ? "rgba(255,255,255,0.06)" : undefined }}
            >
              <span className="text-white/30 flex-shrink-0">{f.icon}</span>
              <span className="text-sm text-white/70">{f.label}</span>
              <span className="ml-auto text-white/20">
                <CheckIcon />
              </span>
            </div>
          ))}
        </div>

        {/* Price card */}
        <div
          ref={priceCardRef}
          className="rounded-2xl border border-white/10 bg-white/4 px-6 py-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs tracking-widest uppercase text-white/30">Monthly plan</p>
            <span className="text-xs text-white/25 border border-white/10 rounded-full px-2.5 py-0.5">
              7-day free trial
            </span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-5xl font-medium tracking-tight text-white">$4.99</span>
            <span className="text-sm text-white/35 mb-1.5">/ month</span>
          </div>
          <p className="text-xs text-white/25 mt-2">Cancel anytime. No questions asked.</p>
        </div>

        {/* CTA */}
        <button
          ref={primaryBtnRef}
          onClick={handlePrimary}
          className="w-full py-3.5 bg-white text-black text-sm font-medium rounded-xl
                     hover:bg-white/90 active:scale-[0.98] transition-all duration-150 mb-3"
        >
          Start free trial →
        </button>

        <button
          ref={ghostBtnRef}
          onClick={handleLater}
          className="w-full py-3.5 border border-white/10 text-white/35 text-sm rounded-xl
                     hover:border-white/20 hover:text-white/50 transition-all duration-150"
        >
          Maybe later
        </button>

      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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