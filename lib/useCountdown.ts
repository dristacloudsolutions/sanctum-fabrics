'use client';

import { useEffect, useState } from 'react';

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; expired: boolean };

function diffToCountdown(endDate: string): Countdown {
  const diffMs = new Date(endDate).getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

// Live-updating countdown to a promotion's end_date — ticks every second on
// the client only (starts from the server-safe "not yet computed" state to
// avoid a hydration mismatch, since the exact remaining time depends on the
// visitor's clock at render time).
export function useCountdown(endDate?: string): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    if (!endDate) { setCountdown(null); return; }
    setCountdown(diffToCountdown(endDate));
    const interval = setInterval(() => setCountdown(diffToCountdown(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return countdown;
}
