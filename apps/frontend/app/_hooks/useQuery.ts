"use client";

import { useQuery as useReactQuery } from "@tanstack/react-query";

type AppQueryKey = readonly [string, ...string[]];

function useQuery<TQueryFnData, TQueryKey extends AppQueryKey = AppQueryKey>({
  queryKey,
  queryFn: passedInQueryFn,
}: {
  queryKey: TQueryKey;
  queryFn: () => TQueryFnData | Promise<TQueryFnData>;
}) {
  return useReactQuery({
    queryKey,
    queryFn: async () => {
      const result = await passedInQueryFn();

      if (
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
      ) {
        throw new Error(result.error);
      }

      return result;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });
}

export { useQuery };
