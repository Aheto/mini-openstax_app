// C:\Users\JNR\mini-openstax\frontend\src\hooks\useApi.ts

import { useState, useEffect, useCallback } from "react";

/**
 * Generic hook for API data fetching with loading/error states
 */
export const useApi = <T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Define fetchData OUTSIDE useEffect so it can be reused
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      const message = err.message || "An unknown error occurred";
      setError(message);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetcher]); // Include fetcher in dependency array

  // Run on mount and when deps change
  useEffect(() => {
    fetchData();
  }, deps);

  return { data, loading, error, refetch: fetchData };
};

// === Specialized hooks for your MVP ===

import { ChapterData, AnalyticsData } from "../types/api";
import { ChapterService, AnalyticsService } from "../services/api";

export const useChapter = (chapterId: string) => {
  return useApi<ChapterData>(
    () => ChapterService.getChapter(chapterId),
    [chapterId]
  );
};

export const useAnalytics = (assignmentId: string) => {
  return useApi<AnalyticsData>(
    () => AnalyticsService.getAssignmentAnalytics(assignmentId),
    [assignmentId]
  );
};
