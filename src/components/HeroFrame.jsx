import React from 'react';

/**
 * Decorative frame for hero sections:
 * - soft radial glow from top
 * - vertical faded border lines on the sides (inner + outer)
 * Rendered absolutely; keep inside a `relative` parent.
 */
export default function HeroFrame() {
  return (
    <>
      {/* Top radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-14 -z-10 h-[60%]"
        style={{
          background:
            'radial-gradient(40% 70% at 50% 0%, hsl(var(--foreground) / 0.08), transparent 70%)',
        }}
      />
      {/* Outer faded vertical borders (wider screens only) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <div
          className="absolute inset-y-0 left-0 w-px bg-foreground/15"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-px bg-foreground/15"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}
        />
      </div>
      {/* Inner faded vertical borders */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-y-0 left-4 md:left-8 w-px bg-gradient-to-b from-transparent via-border to-border" />
        <div className="absolute inset-y-0 right-4 md:right-8 w-px bg-gradient-to-b from-transparent via-border to-border" />
        <div className="absolute inset-y-0 left-8 md:left-12 w-px bg-gradient-to-b from-transparent via-border/50 to-border/50" />
        <div className="absolute inset-y-0 right-8 md:right-12 w-px bg-gradient-to-b from-transparent via-border/50 to-border/50" />
      </div>
    </>
  );
}