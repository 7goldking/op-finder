import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72; // px to trigger refresh

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    // Only activate when scrolled to top
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullY(0); return; }
    e.preventDefault();
    setPullY(Math.min(delta * 0.5, THRESHOLD + 16));
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
  }, [pullY, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none z-10 transition-all duration-150"
        style={{ top: -40 + pullY, opacity: progress }}
      >
        <div className={`w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm`}>
          <RefreshCw
            className="w-4 h-4 text-muted-foreground"
            style={{
              transform: `rotate(${progress * 360}deg)`,
              animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
            }}
          />
        </div>
      </div>
      <div style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 ? 'transform 0.3s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}