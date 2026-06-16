import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { auth, provider, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");

  // Refs
  const containerRef  = useRef(null);
  const logoRef       = useRef(null);
  const headingRef    = useRef(null);
  const subRef        = useRef(null);
  const nameRef       = useRef(null);
  const emailRef      = useRef(null);
  const passRef       = useRef(null);
  const submitRef     = useRef(null);
  const dividerRef    = useRef(null);
  const googleRef     = useRef(null);
  const switchRef     = useRef(null);
  const errorRef      = useRef(null);

  useEffect(() => {
    if (user) { navigate("/dashboard", { replace: true }); return; }
  }, [user, navigate]);

  // Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = [
        logoRef.current,
        headingRef.current,
        subRef.current,
        emailRef.current,
        passRef.current,
        submitRef.current,
        dividerRef.current,
        googleRef.current,
        switchRef.current,
      ].filter(Boolean);

      gsap.set(els, { opacity: 0, y: 20 });
      gsap.to(els, {
        opacity: 1, y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.065,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Toggle between login / signup — slide heading + swap name field
  const handleToggle = () => {
    const formEls = [
      nameRef.current,
      emailRef.current,
      passRef.current,
      submitRef.current,
    ].filter(Boolean);

    gsap.to([headingRef.current, subRef.current], {
      opacity: 0, y: -8, duration: 0.2, ease: "power2.in",
      onComplete: () => {
        setIsLogin((v) => !v);
        setError("");
        gsap.fromTo(
          [headingRef.current, subRef.current],
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
      },
    });

    gsap.to(formEls, {
      opacity: 0, y: -6, duration: 0.15, ease: "power2.in",
      onComplete: () =>
        gsap.to(formEls, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.05 }),
    });
  };

  // Shake on error
  const shakeError = (msg) => {
    setError(msg);
    gsap.fromTo(
      containerRef.current,
      { x: -6 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" }
    );
    if (errorRef.current) {
      gsap.fromTo(errorRef.current, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  gsap.to(submitRef.current, {
    scale: 0.97,
    duration: 0.1,
    ease: "power2.in",
    onComplete: () =>
      gsap.to(submitRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      }),
  });

  try {
    if (isLogin) {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/dashboard", { replace: true });
    } else {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(cred.user, {
        displayName: name,
      });

      const answers = JSON.parse(
        localStorage.getItem("onboardingAnswers") || "{}"
      );

      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          name,
          email,
          onboarding: answers,
          isPremium: false,
          createdAt: new Date(),
        },
        { merge: true }
      );

      navigate("/dashboard", { replace: true });
    }
  } catch (err) {
    console.error(err);
    shakeError(friendlyError(err.code));
  } finally {
    setLoading(false);
  }
};
  const handleGoogle = async () => {
  setLoading(true);
  setError("");

  gsap.to(googleRef.current, {
    scale: 0.97,
    duration: 0.1,
    ease: "power2.in",
    onComplete: () =>
      gsap.to(googleRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      }),
  });

  try {
    const result = await signInWithPopup(
      auth,
      provider
    );

    const answers = JSON.parse(
      localStorage.getItem("onboardingAnswers") || "{}"
    );

    await setDoc(
      doc(db, "users", result.user.uid),
      {
        name: result.user.displayName,
        email: result.user.email,
        onboarding: answers,
        isPremium: false,
        createdAt: new Date(),
      },
      { merge: true }
    );

    navigate("/dashboard", { replace: true });
  } catch (err) {
    console.error(err);
    shakeError(friendlyError(err.code));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div ref={containerRef} className="w-full max-w-sm" style={{ willChange: "transform" }}>

        {/* Logo */}
        <div ref={logoRef} className="mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <SparkleIcon />
            </div>
            <span className="text-sm font-medium tracking-widest uppercase text-white/60">
              xglow ai
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 ref={headingRef} className="text-3xl font-medium text-white mb-2">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p ref={subRef} className="text-sm text-white/40 mb-8">
          {isLogin
            ? "Sign in to continue your glow-up journey."
            : "Start your glow-up journey today."}
        </p>

        {/* Error */}
        {error && (
          <div
            ref={errorRef}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5"
          >
            <AlertIcon />
            <p className="text-xs text-white/60">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div ref={nameRef}>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/25
                           focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
          )}

          <div ref={emailRef}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/25
                         focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <div ref={passRef}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-white/25
                         focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <button
            ref={submitRef}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-black text-sm font-medium rounded-xl
                       disabled:opacity-30 hover:bg-white/90 transition-colors mt-1"
            style={{ willChange: "transform" }}
          >
            {loading
              ? "Please wait…"
              : isLogin ? "Sign in →" : "Create account →"}
          </button>
        </form>

        {/* Divider */}
        <div ref={dividerRef} className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-white/20 tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Google */}
        <button
          ref={googleRef}
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3.5 border border-white/10 text-white/50 text-sm rounded-xl
                     hover:bg-white/4 hover:text-white/70 disabled:opacity-30 transition-colors
                     flex items-center justify-center gap-2.5"
          style={{ willChange: "transform" }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Switch */}
        <p ref={switchRef} className="text-center text-white/30 text-sm mt-7">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={handleToggle}
            className="ml-2 text-white/70 hover:text-white transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>

      </div>
    </div>
  );
}

// Friendly Firebase error messages
function friendlyError(code) {
  const map = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password. Try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="black" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
      className="text-white/40 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.3)"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.25)"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="rgba(255,255,255,0.2)"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}