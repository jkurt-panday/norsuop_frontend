import { useCallback, useEffect, useRef, useState } from "react";

export function getDayLabel(dateString?: string | null): string | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
}

export interface ReloadCooldownReturn {
  reload: () => void;
  isReloading: boolean;
  cooldown: number;
  canReload: boolean;
}

export function useReloadCooldown(
  reloadFn: () => Promise<unknown> | unknown,
  durationSeconds = 10,
): ReloadCooldownReturn {
  const [isReloading, setIsReloading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearCooldownInterval();
    const endTime = Date.now() + durationSeconds * 1000;
    setCooldown(durationSeconds);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCooldown(remaining);
      if (remaining <= 0) {
        clearCooldownInterval();
      }
    }, 200);
  }, [durationSeconds, clearCooldownInterval]);

  useEffect(() => {
    return () => {
      clearCooldownInterval();
    };
  }, [clearCooldownInterval]);

  const canReload = !isReloading && cooldown <= 0;

  const reload = useCallback(() => {
    if (!canReload) {
      return;
    }

    setIsReloading(true);
    Promise.resolve()
      .then(reloadFn)
      .catch(() => undefined)
      .finally(() => {
        setIsReloading(false);
        startCooldown();
      });
  }, [canReload, reloadFn, startCooldown]);

  return {
    reload,
    isReloading,
    cooldown,
    canReload,
  };
}
