import { QueryClient } from "@tanstack/react-query";
import {
  createFavorite,
  updateFavorite,
} from "@/api/favorites";
import { queryKeys } from "@/queryKeys";
import { queryTimes } from "@/queryTimes";
import type { CreateFavorite, Favorite } from "@/types/favorites";
import { debugLog, getErrorMessage } from "@/lib/debugLog";

type UpdateFavoriteVariables = {
  favorite: Favorite;
  changes: Partial<CreateFavorite>;
};

export function createQueryClient() {
  debugLog("Inicio de la aplicación: creando QueryClient.");
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

export async function resumePausedMutations(
  queryClient: QueryClient,
  reason: string
): Promise<void> {
  const pendingMutations = queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === "pending");
  const pausedMutations = pendingMutations.filter(
    (mutation) => mutation.state.isPaused
  );

  debugLog(
    `Reanudando mutaciones (${reason}): ${pendingMutations.length} pendiente(s), ${pausedMutations.length} pausada(s).`
  );

  for (const mutation of pausedMutations) {
    const mutationKey = mutation.options.mutationKey;
    if (JSON.stringify(mutationKey) === JSON.stringify(queryKeys.mutations.createFavorite)) {
      debugLog("Creación de favorito pausada: se reanuda automáticamente.");
    } else if (
      JSON.stringify(mutationKey) ===
      JSON.stringify(queryKeys.mutations.updateFavorite)
    ) {
      debugLog("Edición de favorito pausada: se reanuda automáticamente.");
    }
  }

  try {
    await queryClient.resumePausedMutations();
    debugLog("Finalizó la reanudación de mutaciones pausadas.");
  } catch (error) {
    debugLog(
      `Falló la reanudación de mutaciones: ${getErrorMessage(error)}`
    );
    throw error;
  }
}
