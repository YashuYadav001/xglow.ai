import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PremiumRoute({ children }) {
  const { userData } = useAuth();

  if (!userData?.isPremium) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}