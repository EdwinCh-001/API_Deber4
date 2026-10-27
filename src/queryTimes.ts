export const queryTimes = {
  publicApi: {
    staleTime: 5 * 60 * 1_000,
    gcTime: 48 * 60 * 60 * 1_000,
  },
  mockApi: {
    staleTime: 30 * 1_000,
    gcTime: 24 * 60 * 60 * 1_000,
  },
} as const;
