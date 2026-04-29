import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * Animated state icons. All icons accept { size, color, className, active }.
 * If `active` is provided (boolean), the component is controlled; otherwise it auto-toggles.
 */

function useAutoToggle(interval) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), interval);
    return () => clearInterval(id);
  }, [interval]);
  return on;
}

function useState2(externalValue, interval) {
  const auto = useAutoToggle(interval);
  return externalValue === undefined ? auto : Boolean(externalValue);
}

/* MENU → CLOSE */
export function MenuCloseIcon({ size = 24, color = "currentColor", className, active, duration = 2000 }) {
  const open = useState2(active, duration);
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("", className)} style={{ width: size, height: size }}>
      <motion.line x1="10" x2="30" y1="12" y2="12" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "20px 12px" }}
      />
      <motion.line x1="10" y1="20" x2="30" y2="20" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        initial={{ opacity: 1, scaleX: 1 }}
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <motion.line x1="10" x2="30" y1="28" y2="28" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "20px 28px" }}
      />
    </svg>
  );
}

/* BELL → NOTIFICATION */
export function NotificationIcon({ size = 24, color = "currentColor", className, active, hasUnread = false, duration = 2800 }) {
  const ring = useState2(active, duration);
  return (
    <motion.svg viewBox="0 0 40 40" fill="none" className={cn("", className)}
      animate={ring ? { rotate: [0, 8, -8, 6, -6, 3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
      style={{ width: size, height: size, transformOrigin: "20px 6px" }}>
      <path d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 30a3 3 0 005 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <motion.circle cx="28" cy="10" r="4" fill="hsl(var(--destructive))"
        animate={hasUnread ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      />
    </motion.svg>
  );
}

/* SEND — paper plane flies off then resets */
export function SendIcon({ size = 24, color = "currentColor", className, active, duration = 2600 }) {
  const sent = useState2(active, duration);
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("", className)} style={{ width: size, height: size }}>
      <motion.g
        animate={sent ? { x: 30, y: -30, opacity: 0, scale: 0.5 } : { x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
        <path d="M34 6L16 20l-6-2L34 6z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <path d="M34 6L22 34l-6-14" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <line x1="16" y1="20" x2="22" y2="34" stroke={color} strokeWidth={2} />
      </motion.g>
    </svg>
  );
}

/* HEART → FILLED */
export function HeartIcon({ size = 24, color = "currentColor", className, active, duration = 2000 }) {
  const filled = useState2(active, duration);
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("", className)} style={{ width: size, height: size }}>
      <motion.path
        d="M20 34s-12-7.5-12-16a7.5 7.5 0 0112-6 7.5 7.5 0 0112 6c0 8.5-12 16-12 16z"
        stroke={filled ? "#EF4444" : color}
        strokeWidth={2}
        fill={filled ? "#EF4444" : "none"}
        animate={filled ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformOrigin: "20px 22px" }}
      />
    </svg>
  );
}

/* SUCCESS (loader → check) */
export function SuccessIcon({ size = 24, color = "currentColor", className, active, duration = 2200 }) {
  const done = useState2(active, duration);
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("", className)} style={{ width: size, height: size }}>
      <motion.circle cx="20" cy="20" r="16" stroke={color} strokeWidth={2}
        animate={done ? { pathLength: 1, opacity: 1 } : { pathLength: 0.7, opacity: 0.4 }}
        transition={{ duration: 0.5 }}
      />
      {!done && (
        <motion.circle cx="20" cy="20" r="16" stroke={color} strokeWidth={2}
          strokeLinecap="round" strokeDasharray="25 75"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "20px 20px" }}
        />
      )}
      <motion.path d="M12 20l6 6 10-12" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        animate={done ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: done ? 0.2 : 0 }}
      />
    </svg>
  );
}

/* CLOSE (X) — non-animated helper that mirrors style */
export function CloseIcon({ size = 24, color = "currentColor", className }) {
  return <MenuCloseIcon size={size} color={color} className={className} active />;
}