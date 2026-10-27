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
        onMutate: (variables) => {
            debugLog(
                `TanStack Query onMutate: creación de ${variables.characterName} (personaje ${variables.characterId}).`
            );
            if (!onlineManager.isOnline()) {
                debugLog("Creación de favorito: pendiente por falta de conexión.");
            }
        },
        onSuccess: async (created, variables) => {
            debugLog("TanStack Query onSuccess: creación de favorito completada.");
            debugLog(
                `Favorito guardado correctamente: ${created.characterName} (personaje ${variables.characterId}).`
            );
            debugLog(
                `Ejecutando invalidateQueries() tras crear favorito: ${JSON.stringify(queryKeys.favorites.lists())}.`
            );
            await queryClient.invalidateQueries({
                queryKey: queryKeys.favorites.lists(),
            });
        },
        onError: (error, variables) => {
            debugLog(
                `TanStack Query onError: creación de ${variables.characterName} (personaje ${variables.characterId}).`
            );
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

    onMutate: (variables) => {
      debugLog(
        `TanStack Query onMutate: edición de ${variables.favorite.characterName} (registro ${variables.favorite.id}).`
      );
      if (!onlineManager.isOnline()) {
        debugLog("Edición de favorito: pendiente por falta de conexión.");
      }
    },
    onSuccess: async (updated: Favorite) => {
      debugLog("TanStack Query onSuccess: edición de favorito completada.");
      debugLog(
        `Favorito editado correctamente: ${updated.characterName} (registro ${updated.id}).`
      );
      debugLog(
        `Ejecutando invalidateQueries() tras editar favorito: ${JSON.stringify(queryKeys.favorites.lists())}.`
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.lists(),
      });

      if (updated.id) {
        debugLog(
          `Ejecutando invalidateQueries() del detalle actualizado: ${JSON.stringify(queryKeys.favorites.detail(updated.id))}.`
        );
        await queryClient.invalidateQueries({
          queryKey: queryKeys.favorites.detail(updated.id),
        });
      }
    },
    onError: (error, variables) => {
      debugLog(
        `TanStack Query onError: edición de ${variables.favorite.characterName} (registro ${variables.favorite.id}).`
      );
      debugLog(`Mutación de edición falló: ${getErrorMessage(error)}`);
    },
  });
}