import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimerOptions {
  timeoutMinutes: number;
  enabled: boolean;
  onIdle: () => void;
}

export function useInactivityTimer({
  timeoutMinutes,
  enabled,
  onIdle,
}: UseInactivityTimerOptions) {
  const timeoutIdRef = useRef<any>(null);
  const intervalIdRef = useRef<any>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onIdleRef = useRef(onIdle);

  // Keep latest onIdle callback in ref
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (!enabled || timeoutMinutes <= 0) return;

    const timeoutMs = Math.max(1000, Math.round(timeoutMinutes * 60 * 1000));
    timeoutIdRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutMs);
  }, [enabled, timeoutMinutes]);

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Initial timer start on mount or when timeout/enabled changes
    resetTimer();

    // 1-second periodic sanity check to protect against browser tab throttling or timer drift
    const timeoutMs = Math.max(1000, Math.round(timeoutMinutes * 60 * 1000));
    intervalIdRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current >= timeoutMs) {
        onIdleRef.current();
      }
    }, 1000);

    // Activity detector
    const handleActivity = () => {
      const now = Date.now();
      // Throttle event checks to every 500ms to keep performance smooth while responsive
      if (now - lastActivityRef.current > 500) {
        resetTimer();
      }
    };

    // When tab becomes visible again, check elapsed time
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && timeoutMinutes > 0) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          onIdleRef.current();
        }
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, timeoutMinutes, resetTimer]);

  return { resetTimer };
}
