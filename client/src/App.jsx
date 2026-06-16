import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/upload";
import Results from "./pages/results";
import Pricing from "./pages/pricing";
import Premium from "./pages/premium";
import Progress from "./pages/Progress/Progress";



function App() {
  return (
    <BrowserRouter>
      
       <Routes>
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/login" element={<Login />} />

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/upload"
    element={
      <ProtectedRoute>
        <Upload />
      </ProtectedRoute>
    }
  />

  <Route
    path="/results"
    element={
      <ProtectedRoute>
        <Results />
      </ProtectedRoute>
    }
  />

  <Route
    path="/pricing"
    element={
      <ProtectedRoute>
        <Pricing />
      </ProtectedRoute>
    }
  />

  <Route
    path="/premium"
    element={
      <ProtectedRoute>
        <Premium />
      </ProtectedRoute>
    }
  />

  <Route
    path="/progress"
    element={
      <ProtectedRoute>
        <Progress />
      </ProtectedRoute>
    }
  />
</Routes>
      
    </BrowserRouter>
  );
}

export default App;