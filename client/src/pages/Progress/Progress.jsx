import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function Progress() {
  const { user } = useAuth();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadAnalyses = async () => {
      try {
        const analysesRef = collection(
          db,
          "users",
          user.uid,
          "analyses"
        );

        const q = query(
          analysesRef,
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAnalyses(data);
      } catch (error) {
        console.error("Failed to load analyses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyses();
  }, [user]);

  const latest = analyses[0];

  const averageSymmetry = useMemo(() => {
    if (!analyses.length) return "—";

    const total = analyses.reduce(
      (sum, item) => sum + (item.symmetry || 0),
      0
    );

    return `${Math.round(total / analyses.length)}%`;
  }, [analyses]);

  const chartData = useMemo(() => {
    return [...analyses]
      .reverse()
      .map((item) => ({
        date:
          item.createdAt?.toDate?.().toLocaleDateString() ||
          "Today",
        symmetry: item.symmetry || 0,
      }));
  }, [analyses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-2">
            Progress
          </p>

          <h1 className="text-3xl font-semibold mb-2">
            Your Glow-Up Journey
          </h1>

          <p className="text-white/50">
            Track your face analysis results over time.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 mb-2">
              Analyses Done
            </p>

            <p className="text-2xl font-semibold">
              {analyses.length}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 mb-2">
              Average Symmetry
            </p>

            <p className="text-2xl font-semibold">
              {averageSymmetry}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 mb-2">
              Latest Face Shape
            </p>

            <p className="text-2xl font-semibold">
              {latest?.faceShape || "—"}
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-medium">
                Symmetry Trend
              </h2>

              <p className="text-sm text-white/40">
                Your symmetry score across analyses.
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[50, 100]}
                    tick={{ fill: "#888", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="symmetry"
                    stroke="#ffffff"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History */}
        <div className="mb-4">
          <h2 className="text-lg font-medium">
            Analysis History
          </h2>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/50">
            No analyses yet. Upload your first selfie to begin tracking progress.
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium">
                    {analysis.faceShape}
                  </span>

                  <span className="text-xs text-white/40">
                    {analysis.createdAt?.toDate?.().toLocaleDateString() ||
                      "Today"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/40 mb-1">
                      Confidence
                    </p>

                    <p className="text-white/80">
                      {analysis.confidence}%
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">
                      Symmetry
                    </p>

                    <p className="text-white/80">
                      {analysis.symmetry}%
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">
                      Hairstyle
                    </p>

                    <p className="text-white/80">
                      {analysis.hairstyle}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 mb-1">
                      Focus Area
                    </p>

                    <p className="text-white/80">
                      {analysis.focusArea}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}