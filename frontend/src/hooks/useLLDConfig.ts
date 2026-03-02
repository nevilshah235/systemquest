/**
 * useLLDConfig — fetches and parses the LLD config and previous attempt for a mission.
 *
 * Returns null config if the mission has no LLD section (graceful hide handled by LLDBuilder).
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../data/api';
import type { LLDApiResponse, LLDMissionConfig } from '../data/lldTypes';

interface UseLLDConfigResult {
  config: LLDMissionConfig | null;
  apiResponse: LLDApiResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function useLLDConfig(missionSlug: string): UseLLDConfigResult {
  const [apiResponse, setApiResponse] = useState<LLDApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!missionSlug) return;

    setIsLoading(true);
    setError(null);

    apiClient
      .get<LLDApiResponse>(`/lld/${missionSlug}`)
      .then((data) => {
        setApiResponse(data);
      })
      .catch((err: unknown) => {
        // 404 is expected (LLD not enabled) — treat silently
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404) {
          setError(err instanceof Error ? err : new Error('Failed to load LLD config'));
        }
        setApiResponse(null);
      })
      .finally(() => setIsLoading(false));
  }, [missionSlug]);

  return {
    config: apiResponse?.lldConfig ?? null,
    apiResponse,
    isLoading,
    error,
  };
}
