import React from 'react';
import { useMotionValue, motion, useMotionTemplate } from 'framer-motion';

/**
 * Global decorative background: dotted pattern with a soft spotlight
 * that follows the cursor. Fixed behind all content, pointer-events none.
 */
export default function SiteBackground() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  React.useEffect(() => {
    const onMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  const dotPattern = (color) => ({
    backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
    backgroundSize: '18px 18px',
  });

  const maskImage = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none bg-background">
      {/* base dots (light) */}
      <div
        className="absolute inset-0 opacity-100 dark:opacity-0"
        style={dotPattern('hsl(var(--muted-foreground) / 0.45)')}
      />
      {/* base dots (dark) */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={dotPattern('hsl(var(--muted-foreground) / 0.6)')}
      />
      {/* cursor spotlight */}
      <motion.div
        className="absolute inset-0"
        style={{
          ...dotPattern('hsl(var(--foreground))'),
          WebkitMaskImage: maskImage,
          maskImage,
        }}
      />
    </div>
  );
}