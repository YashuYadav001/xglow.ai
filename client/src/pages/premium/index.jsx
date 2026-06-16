import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function Premium() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAnalysis = async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", user.uid)
        );

        if (snap.exists()) {
          const data = snap.data();

          setAnalysis(data.analysis || null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading premium insights...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No analysis found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto space-y-4">

        <h1 className="text-3xl font-semibold mb-8">
          Premium Insights
        </h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-2">
            Face shape
          </p>

          <p className="text-xl font-medium">
            {analysis.faceShape}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-2">
            Best hairstyle
          </p>

          <p className="text-xl font-medium">
            {analysis.hairstyle}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-2">
            Beard recommendation
          </p>

          <p className="text-xl font-medium">
            {analysis.beardStyle}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-sm mb-2">
            Recommended colors
          </p>

          <div className="flex gap-2 mt-3">
            {analysis.colors?.map((color) => (
              <span
                key={color}
                className="px-3 py-1 rounded-full bg-white/10 text-sm"
              >
                {color}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}