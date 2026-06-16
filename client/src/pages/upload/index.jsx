import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";

export default function Upload() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const headingRef = useRef(null);
  const subRef = useRef(null);
  const dropzoneRef = useRef(null);
  const previewRef = useRef(null);
  const btnRef = useRef(null);
  const backRef = useRef(null);
  const inputRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([headingRef.current, subRef.current, dropzoneRef.current, btnRef.current, backRef.current], {
        opacity: 0,
        y: 20,
      });
      gsap.to(headingRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.1 });
      gsap.to(subRef.current,     { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.2 });
      gsap.to(dropzoneRef.current,{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.3 });
      gsap.to(btnRef.current,     { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 });
      gsap.to(backRef.current,    { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.45 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Preview swap animation
  const handleChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const url = URL.createObjectURL(file);

    if (imagePreview && previewRef.current) {
      gsap.to(previewRef.current, {
        opacity: 0, scale: 0.96, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          setImagePreview(url);
          gsap.fromTo(previewRef.current,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }
          );
        },
      });
    } else {
      setImagePreview(url);
      // preview reveal after state update
      requestAnimationFrame(() => {
        if (previewRef.current) {
          gsap.fromTo(previewRef.current,
            { opacity: 0, scale: 0.95, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power2.out" }
          );
        }
      });
    }
  };

  const handleFileInput = (e) => handleChange(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    gsap.to(dropzoneRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
    handleChange(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
    gsap.to(dropzoneRef.current, { scale: 1.015, duration: 0.2, ease: "power2.out" });
  };

  const handleDragLeave = () => {
    setIsDragging(false);
    gsap.to(dropzoneRef.current, { scale: 1, duration: 0.2, ease: "power2.out" });
  };

  const handleAnalyze = () => {
    gsap.to(btnRef.current, {
      scale: 0.97, duration: 0.1, ease: "power2.in",
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0, y: -16, duration: 0.35, ease: "power2.in",
          onComplete: () => navigate("/results", { state: { imageUrl: imagePreview } }),
        });
      },
    });
  };

  const handleBack = () => {
    gsap.to(containerRef.current, {
      opacity: 0, y: 16, duration: 0.3, ease: "power2.in",
      onComplete: () => navigate(-1),
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div ref={containerRef} className="w-full max-w-md">

        {/* Back */}
        <button
          ref={backRef}
          onClick={handleBack}
          className="flex items-center gap-1.5 text-white/30 text-sm mb-8 hover:text-white/60 transition-colors"
        >
          <ArrowLeftIcon />
          Back
        </button>

        {/* Heading */}
        <p ref={subRef} className="text-xs tracking-widest uppercase text-white/25 mb-1">Step 1 of 1</p>
        <h1 ref={headingRef} className="text-3xl font-medium text-white mb-2">Upload a selfie</h1>
        <p className="text-sm text-white/40 mb-7">
          Use a clear, front-facing photo for the best results.
        </p>

        {/* Dropzone */}
        <div
          ref={dropzoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative w-full rounded-2xl border cursor-pointer overflow-hidden transition-colors duration-200
            ${isDragging
              ? "border-white/40 bg-white/8"
              : imagePreview
                ? "border-white/10 bg-transparent"
                : "border-white/10 bg-white/4 hover:bg-white/6 hover:border-white/20"
            }
          `}
          style={{ minHeight: imagePreview ? "auto" : "220px" }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          {imagePreview ? (
            <div ref={previewRef}>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-2xl object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <CameraIcon />
                <span className="text-sm text-white font-medium">Replace photo</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/30">
                <UploadIcon />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/50">Drop a photo here</p>
                <p className="text-xs text-white/25 mt-0.5">or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {/* Analyze button */}
        <button
          ref={btnRef}
          onClick={handleAnalyze}
          disabled={!imagePreview}
          className="mt-4 w-full py-3.5 bg-white text-black text-sm font-medium rounded-xl
                     disabled:opacity-25 disabled:cursor-not-allowed
                     hover:bg-white/90 active:scale-[0.98] transition-all duration-150"
        >
          {imagePreview ? "Analyze selfie →" : "Select a photo first"}
        </button>

      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}