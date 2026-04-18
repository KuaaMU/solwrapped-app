"use client";

import { useMemo, useRef, useEffect } from "react";
import { generateLogo, profileToLogoParams, type LogoParams } from "@/lib/logo-svg";
import type { WalletProfile } from "@/lib/types";

interface LogoProps {
  profile?: WalletProfile;
  accent?: string;
  showText?: boolean;
  title?: string;
  tagline?: string;
  size?: string | number;
  className?: string;
  params?: Partial<LogoParams>;
  pulse?: boolean;
  /** Enable mouse-reactive eye tracking (inner iris + pupil follow cursor) */
  interactive?: boolean;
}

export function Logo({
  profile,
  accent,
  showText = false,
  title,
  tagline,
  size,
  className = "",
  params,
  pulse = false,
  interactive = false,
}: LogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const svg = useMemo(() => {
    const baseParams: LogoParams = profile
      ? profileToLogoParams(profile, accent)
      : { accent };
    const merged: LogoParams = { ...baseParams, ...params, showText, title, tagline };
    return generateLogo(merged);
  }, [profile, accent, showText, title, tagline, params]);

  // Eye-tracking: iris + pupil follow cursor, while the frame stays fixed
  useEffect(() => {
    if (!interactive) return;
    const el = containerRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    // Grab iris (inner ring) and pupil (particles + core) groups — one set per channel
    const irises = inner.querySelectorAll<SVGGElement>(".logo-iris");
    const pupils = inner.querySelectorAll<SVGGElement>(".logo-pupil");
    if (irises.length === 0 || pupils.length === 0) return;

    let rafId: number | null = null;
    let tIrisX = 0, tIrisY = 0, cIrisX = 0, cIrisY = 0;
    let tPupilX = 0, tPupilY = 0, cPupilX = 0, cPupilY = 0;
    let tDriftX = 0, tDriftY = 0, cDriftX = 0, cDriftY = 0;

    const animate = () => {
      // Snappier lerp for pupil, gentler for iris, so the pupil feels like the
      // "eye" and the iris follows as a secondary layer.
      const pupilLerp = 0.2;
      const irisLerp = 0.12;
      const driftLerp = 0.08;
      cIrisX += (tIrisX - cIrisX) * irisLerp;
      cIrisY += (tIrisY - cIrisY) * irisLerp;
      cPupilX += (tPupilX - cPupilX) * pupilLerp;
      cPupilY += (tPupilY - cPupilY) * pupilLerp;
      cDriftX += (tDriftX - cDriftX) * driftLerp;
      cDriftY += (tDriftY - cDriftY) * driftLerp;

      const irisT = `translate(${cIrisX.toFixed(1)} ${cIrisY.toFixed(1)})`;
      const pupilT = `translate(${cPupilX.toFixed(1)} ${cPupilY.toFixed(1)})`;
      irises.forEach((g) => g.setAttribute("transform", irisT));
      pupils.forEach((g) => g.setAttribute("transform", pupilT));
      el.style.transform = `translate(${cDriftX.toFixed(1)}px, ${cDriftY.toFixed(1)}px)`;

      rafId = requestAnimationFrame(animate);
    };

    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);
      const mag = Math.min(Math.hypot(nx, ny), 1);
      const ang = Math.atan2(ny, nx);

      // In SVG viewBox units (800×800). Different amplitudes so pupil slides
      // inside iris while iris drifts inside the outer frame.
      const maxPupil = 34;   // pupil vs iris — biggest visible motion
      const maxIris = 22;    // iris vs outer frame — secondary drift
      tPupilX = Math.cos(ang) * mag * maxPupil;
      tPupilY = Math.sin(ang) * mag * maxPupil;
      tIrisX = Math.cos(ang) * mag * maxIris;
      tIrisY = Math.sin(ang) * mag * maxIris;

      // Subtle whole-logo parallax
      const maxDrift = 6;
      tDriftX = Math.cos(ang) * mag * maxDrift;
      tDriftY = Math.sin(ang) * mag * maxDrift;
    };

    const leave = () => {
      tIrisX = tIrisY = 0;
      tPupilX = tPupilY = 0;
      tDriftX = tDriftY = 0;
    };

    window.addEventListener("mousemove", handler);
    window.addEventListener("blur", leave);
    document.addEventListener("mouseleave", leave);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("blur", leave);
      document.removeEventListener("mouseleave", leave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [interactive, svg]);

  const sizeStyle = size !== undefined
    ? { width: typeof size === "number" ? `${size}px` : size, height: "auto" }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`${className} relative`}
      style={{
        ...sizeStyle,
        willChange: interactive ? "transform" : undefined,
      }}
      aria-label={profile ? `SolWrapped logo for ${profile.address.slice(0, 6)}...` : "SolWrapped logo"}
      role="img"
    >
      <div
        ref={innerRef}
        className={pulse ? "pupil-pulse" : ""}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
