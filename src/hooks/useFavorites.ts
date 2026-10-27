import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFavorite,
  getFavorites,
  updateFavorite,
} from "@/api/favorites";
import type { Favorite, CreateFavorite } from "@/types/favorites";
import { queryKeys } from "@/queryKeys";
import { queryTimes } from "@/queryTimes";

export function useFavorites() {
    return useQuery({
        queryKey: queryKeys.favorites.list(),
        queryFn: getFavorites,
        staleTime: queryTimes.mockApi.staleTime,
        gcTime: queryTimes.mockApi.gcTime,
    });
}

export function useCreateFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: queryKeys.mutations.createFavorite,
        mutationFn: createFavorite,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.favorites.lists(),
            });
        },
    });
}

export function useUpdateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.mutations.updateFavorite,
    mutationFn: ({
      favorite,
      changes,
    }: {
      favorite: Favorite;
      changes: Partial<CreateFavorite>;
    }) => updateFavorite(favorite, changes),

    onSuccess: async (updated: Favorite) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.lists(),
      });

      if (updated.id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.favorites.detail(updated.id),
        });
      }
    },
  });
}