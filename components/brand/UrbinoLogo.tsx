"use client";

import { useId } from "react";

/** Urbino logo: round badge with gradient disc, white U-ring and H cutouts. */
export default function UrbinoLogo({ className = "h-9 w-9" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const ring = `ring-${uid}`;
  const disc = `disc-${uid}`;

  return (
    <svg viewBox="0 0 640 640" className={className} role="img" aria-label="Urbino">
      <defs>
        <linearGradient id={ring} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
          <stop offset="0" stopColor="#E5402B" />
          <stop offset="0.5" stopColor="#EF7A2D" />
          <stop offset="1" stopColor="#F4B63F" />
        </linearGradient>
        <linearGradient id={disc} gradientUnits="userSpaceOnUse" x1="0" y1="89" x2="0" y2="545">
          <stop offset="0" stopColor="#F8B533" />
          <stop offset="0.5" stopColor="#F0702B" />
          <stop offset="1" stopColor="#DD3226" />
        </linearGradient>
      </defs>
      <circle cx="320" cy="320" r="316" fill="#fff" stroke={`url(#${ring})`} strokeWidth="8" />
      <circle cx="320" cy="317" r="228" fill={`url(#${disc})`} />
      <path d="M192 139V376A128 128 0 0 0 448 376V139" fill="none" stroke="#fff" strokeWidth="30" />
      <path d="M207 94V376A113 113 0 0 0 433 376V94Z" fill={`url(#${disc})`} />
      <path d="M262 60V177A58 58 0 0 0 378 177V60Z" fill="#fff" />
      <path d="M262 485V349A58 58 0 0 1 378 349V485Z" fill="#fff" />
    </svg>
  );
}
