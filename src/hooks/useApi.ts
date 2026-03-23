"use client";

export { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 自定义 hooks 用于常用的 API 请求
export function useApiQuery<T>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options?: { staleTime?: number; enabled?: boolean }
) {
  const { useQuery } = require("@tanstack/react-query");
  return useQuery({
    queryKey,
    queryFn: fetcher,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 默认 5 分钟
    enabled: options?.enabled,
  });
}

export function useApiMutation<T, V>(
  mutationKey: string[],
  mutater: (variables: V) => Promise<T>,
  options?: { onSuccess?: (data: T) => void }
) {
  const { useMutation } = require("@tanstack/react-query");
  return useMutation({
    mutationKey,
    mutationFn: mutater,
    onSuccess: options?.onSuccess,
  });
}
