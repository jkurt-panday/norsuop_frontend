import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseReloadCooldownOptions {
  only?: string[];
  durationSeconds?: number;
}

interface UseReloadCooldownReturn {
  reload: () => void;
  isReloading: boolean;
  cooldown: number;
  canReload: boolean;
}

export function useReloadCooldown({
  only,
  durationSeconds = 10,
}: UseReloadCooldownOptions = {}): UseReloadCooldownReturn {
  const queryClient = useQueryClient();
  const [isReloading, setIsReloading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownEndRef = useRef<number | null>(null);
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
    cooldownEndRef.current = endTime;
    setCooldown(durationSeconds);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCooldown(remaining);
      if (remaining <= 0) {
        clearCooldownInterval();
        cooldownEndRef.current = null;
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
    queryClient
      .refetchQueries({
        queryKey: only,
      })
      .catch(() => {})
      .finally(() => {
        setIsReloading(false);
        startCooldown();
      });
  }, [canReload, only, queryClient, startCooldown]);

  return {
    reload,
    isReloading,
    cooldown,
    canReload,
  };
}