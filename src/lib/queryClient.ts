import { QueryClient } from "@tanstack/react-query";
import {
  createFavorite,
  updateFavorite,
} from "@/api/favorites";
import { queryKeys } from "@/queryKeys";
import { queryTimes } from "@/queryTimes";
import type { CreateFavorite, Favorite } from "@/types/favorites";

type UpdateFavoriteVariables = {
  favorite: Favorite;
  changes: Partial<CreateFavorite>;
};

export function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryTimes.publicApi.staleTime,
        gcTime: queryTimes.publicApi.gcTime,
        retry: 1,
      },
    },
  });

  // Persisted mutations need a function registered before cache hydration.
  queryClient.setMutationDefaults<CreateFavorite, Error, CreateFavorite>(
    queryKeys.mutations.createFavorite,
    {
      mutationFn: createFavorite,
      networkMode: "online",
      retry: 2,
    }
  );
  queryClient.setMutationDefaults<
    Favorite,
    Error,
    UpdateFavoriteVariables
  >(queryKeys.mutations.updateFavorite, {
    mutationFn: ({ favorite, changes }) => updateFavorite(favorite, changes),
    networkMode: "online",
    retry: 2,
  });

  return queryClient;
}
