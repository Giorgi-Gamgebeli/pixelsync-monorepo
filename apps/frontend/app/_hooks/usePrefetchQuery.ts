"use client";

import { useQueryClient } from "@tanstack/react-query";

type AppQueryKey = readonly [string, ...string[]];

function usePrefetchQuery() {
  const queryClient = useQueryClient();

  function prefetchQuery<TQueryFnData, TQueryKey extends AppQueryKey>({
    queryKey,
    queryFn,
  }: {
    queryKey: TQueryKey;
    queryFn: () => TQueryFnData | Promise<TQueryFnData>;
  }) {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
    });
  }

  return { prefetchQuery };
}

export { usePrefetchQuery };
