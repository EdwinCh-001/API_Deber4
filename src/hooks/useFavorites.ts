import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createFavorite,
  getFavorites,
  updateFavorite,
} from "@/api/favorites";
import type { Favorite, CreateFavorite } from "@/types/favorites";
import { queryKeys } from "@/queryKeys";
import { queryTimes } from "@/queryTimes";
import { debugLog, getErrorMessage } from "@/lib/debugLog";

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
        onMutate: () => {
            debugLog("Creación de favorito: mutación iniciada.");
            if (!onlineManager.isOnline()) {
                debugLog("Creación de favorito: pendiente por falta de conexión.");
            }
        },
        onSuccess: async () => {
            debugLog(
                `Invalidación tras crear favorito: ${JSON.stringify(queryKeys.favorites.lists())}.`
            );
            await queryClient.invalidateQueries({
                queryKey: queryKeys.favorites.lists(),
            });
        },
        onError: (error) => {
            debugLog(`Mutación de creación falló: ${getErrorMessage(error)}`);
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

    onMutate: () => {
      debugLog("Edición de favorito: mutación iniciada.");
      if (!onlineManager.isOnline()) {
        debugLog("Edición de favorito: pendiente por falta de conexión.");
      }
    },
    onSuccess: async (updated: Favorite) => {
      debugLog(
        `Invalidación tras editar favorito: ${JSON.stringify(queryKeys.favorites.lists())}.`
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.lists(),
      });

      if (updated.id) {
        debugLog(
          `Invalidación tras editar favorito: ${JSON.stringify(queryKeys.favorites.detail(updated.id))}.`
        );
        await queryClient.invalidateQueries({
          queryKey: queryKeys.favorites.detail(updated.id),
        });
      }
    },
    onError: (error) => {
      debugLog(`Mutación de edición falló: ${getErrorMessage(error)}`);
    },
  });
}