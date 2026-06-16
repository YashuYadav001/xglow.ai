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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState([
    { label: "Analyses done", value: "0" },
    { label: "Glow score", value: "—" },
    { label: "Last upload", value: "None yet" },
  ]);

  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const statRefs = useRef([]);
  const uploadBtnRef = useRef(null);
  const progressBtnRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;

    const loadDashboard = async () => {
      try {
        const analysesRef = collection(
          db,
          "users",
          user.uid,
          "analyses"
        );

        const q = query(
          analysesRef,
          orderBy("createdAt", "desc"),
          limit(10)
        );

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
            },
            {
              label: "Glow score",
              value: latest.symmetry
                ? `${latest.symmetry}%`
                : "—",
            },
            {
              label: "Last upload",
              value:
                latest.createdAt?.toDate?.().toLocaleDateString() ||
                "Today",
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
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      const els = [
        ...statRefs.current,
        uploadBtnRef.current,
        progressBtnRef.current,
      ].filter(Boolean);

      gsap.fromTo(
        els,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white px-6 py-10"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase text-white/30 mb-2">
            Welcome back
          </p>

          <h1 className="text-3xl font-medium mb-2">
            {user?.displayName || user?.email}
          </h1>

          <p className="text-white/50">
            Track your glow-up journey over time.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              ref={(el) => (statRefs.current[index] = el)}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-xs text-white/40 mb-2">
                {stat.label}
              </p>

              <p className="text-lg font-medium break-words">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            ref={uploadBtnRef}
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-medium hover:bg-white/90 transition"
          >
            <CameraIcon />
            Upload selfie
          </button>

          <button
            ref={progressBtnRef}
            onClick={() => navigate("/progress")}
            className="flex items-center gap-2 border border-white/15 px-5 py-3 rounded-xl hover:bg-white/5 transition"
          >
            <ChartIcon />
            View progress
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-white/15 px-5 py-3 rounded-xl text-white/60 hover:bg-white/5 transition"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>

        {/* Recent Analysis */}
        <p className="text-xs tracking-widest uppercase text-white/30 mb-3">
          Recent Analysis
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          {loading ? (
            <p className="text-white/40">Loading...</p>
          ) : latestAnalysis ? (
            <div className="space-y-2">
              <p>
                Face shape:{" "}
                <span className="text-white/70">
                  {latestAnalysis.faceShape}
                </span>
              </p>

              <p>
                Hairstyle:{" "}
                <span className="text-white/70">
                  {latestAnalysis.hairstyle}
                </span>
              </p>

              <p>
                Symmetry:{" "}
                <span className="text-white/70">
                  {latestAnalysis.symmetry}%
                </span>
              </p>

              <p>
                Focus area:{" "}
                <span className="text-white/70">
                  {latestAnalysis.focusArea}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-white/40">
              Your analysis history will appear here after your first upload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v18h18M7 14l4-4 3 3 5-7"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  );
}