import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomeRedirect() {
  const { user } = useAuth();

  const hasSeenOnboarding =
    localStorage.getItem("hasSeenOnboarding") === "true";

  if (!hasSeenOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}