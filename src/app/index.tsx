
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import {
  useMutationState,
  useQuery,
  useIsRestoring,
} from "@tanstack/react-query";
import { getCharacters } from "@/api/characters";
import { queryKeys } from "@/queryKeys";
import {
  useFavorites,
  useCreateFavorite,
  useUpdateFavorite,
} from "@/hooks/useFavorites";
import type { Character } from "@/types/characters";
import type { Favorite } from "@/types/favorites";
import { useState } from "react";
import { queryTimes } from "@/queryTimes";
import {
  countWords,
  getNoteValidationError,
  MAX_NOTE_WORDS,
} from "@/lib/noteValidation";

export default function HomeScreen() {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(
    null
  );
  const isRestoring = useIsRestoring();
  const pendingMutations = useMutationState({
    filters: { status: "pending" },
    select: (mutation) => mutation.state.isPaused,
  });

  const { data, isPending, isError, isFetching, error } = useQuery({
    queryKey: queryKeys.characters.list(),
    queryFn: getCharacters,
    staleTime: queryTimes.publicApi.staleTime,
    gcTime: queryTimes.publicApi.gcTime,
  });

  const {
    data: favorites,
    isPending: favoritesPending,
    isError: favoritesError,
  } = useFavorites();

  const createMutation = useCreateFavorite();
  const updateMutation = useUpdateFavorite();

  async function saveFavorite(character: Character) {
    const note = notes[character.id] ?? "";
    const validationError = getNoteValidationError(note);
    if (validationError) {
      Alert.alert("Nota inválida", validationError);
      return;
    }

    try {
      await createMutation.mutateAsync({
        characterId: character.id,
        characterName: character.name,
        note,
        isFavorite: true,
      });

      Alert.alert("¡Listo!", "El favorito se guardó correctamente.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo guardar el favorito."
      );
    }
  }

  async function editFavorite(favorite: Favorite) {
    const note = notes[favorite.characterId] ?? favorite.note;
    const validationError = getNoteValidationError(note);
    if (validationError) {
      Alert.alert("Nota inválida", validationError);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        favorite,
        changes: { note },
      });

      setEditingFavoriteId(null);
      Alert.alert("¡Listo!", "Tu nota se actualizó.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la nota."
      );
    }
  }

  if (isPending && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>
          {isRestoring ? "Restaurando datos guardados..." : "Cargando personajes..."}
        </Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Rick and Morty</Text>
          <Text style={styles.subtitle}>
            Personajes: {data.length}
          </Text>
          {isFetching && (
            <Text style={styles.status}>
              Actualizando catálogo en segundo plano...
            </Text>
          )}
          {isError && (
            <Text style={styles.error}>
              No se pudo actualizar; se muestran los datos guardados.
            </Text>
          )}
          <Text style={styles.sectionTitle}>
            Mis favoritos guardados
          </Text>

          {favoritesPending && <Text>Cargando favoritos...</Text>}
          {favoritesError && (
            <Text>No se pudieron cargar los favoritos.</Text>
          )}
          {!favoritesPending && !favoritesError && (
            <Text>
              Tienes {favorites?.filter((f) => f.isFavorite).length ?? 0}{" "}
              favoritos
            </Text>
          )}
          {pendingMutations.length > 0 && (
            <Text style={styles.pending}>
              {pendingMutations.some(Boolean)
                ? `${pendingMutations.length} cambio(s) pendiente(s): se enviarán al recuperar la conexión.`
                : "Guardando cambios..."}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const favorite = favorites?.find(
          (f) => f.characterId === item.id
        );
        const isEditingFavorite =
          favorite?.id != null && favorite.id === editingFavoriteId;
        const noteDraft = notes[item.id] ?? favorite?.note ?? "";
        const noteValidationError = getNoteValidationError(noteDraft);

        return (
          <View style={styles.card}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
            />

            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text>Especie: {item.species}</Text>
              <Text>Estado: {item.status}</Text>

              {favorite && !isEditingFavorite ? (
                <Text style={styles.note}>
                  Nota: {favorite.note || "Sin nota"}
                </Text>
              ) : (
                <View style={styles.noteInputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe una nota..."
                    value={noteDraft}
                    onChangeText={(text) =>
                      setNotes((previous) => ({
                        ...previous,
                        [item.id]: text,
                      }))
                    }
                  />
                  <Text
                    style={
                      noteValidationError
                        ? styles.validationError
                        : styles.noteCounter
                    }
                  >
                    {noteValidationError ??
                      `${countWords(noteDraft)} / ${MAX_NOTE_WORDS} palabras`}
                  </Text>
                </View>
              )}

              {!favorite && (
                <Pressable
                  style={styles.button}
                  onPress={() => saveFavorite(item)}
                  disabled={
                    createMutation.isPending || noteValidationError !== null
                  }
                >
                  <Text style={styles.buttonText}>Añadir favorito</Text>
                </Pressable>
              )}
            </View>

            {favorite?.id && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    updateMutation.isPending ||
                    (editingFavoriteId !== null && !isEditingFavorite) ||
                    (isEditingFavorite && noteValidationError !== null),
                }}
                accessibilityLabel={
                  isEditingFavorite
                    ? `Guardar nota de ${favorite.characterName}`
                    : `Editar favorito ${favorite.characterName}`
                }
                style={[
                  styles.editIcon,
                  editingFavoriteId !== null &&
                    !isEditingFavorite &&
                    styles.editIconDisabled,
                ]}
                onPress={() => {
                  if (isEditingFavorite) {
                    void editFavorite(favorite);
                    return;
                  }

                  setNotes((previous) => ({
                    ...previous,
                    [favorite.characterId]: favorite.note,
                  }));
                  setEditingFavoriteId(favorite.id);
                }}
                disabled={
                  updateMutation.isPending ||
                  (editingFavoriteId !== null && !isEditingFavorite) ||
                  (isEditingFavorite && noteValidationError !== null)
                }
              >
                <Text style={styles.editIconText}>
                  {isEditingFavorite ? "✓" : "✎"}
                </Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  header: {
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#555",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  pending: {
    color: "#b45309",
    fontWeight: "600",
  },
  status: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
  card: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  image: {
    width: 110,
    height: 140,
  },
  info: {
    flex: 1,
    justifyContent: "center",
    padding: 10,
    paddingRight: 44,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#fff",
  },
  noteInputGroup: {
    gap: 4,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 9,
    borderRadius: 6,
    alignItems: "center",
  },
  note: {
    color: "#334155",
  },
  noteCounter: {
    color: "#64748b",
    fontSize: 12,
  },
  validationError: {
    color: "#b91c1c",
    fontSize: 12,
  },
  editIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  editIconDisabled: {
    opacity: 0.4,
  },
  editIconText: {
    color: "#1e293b",
    fontSize: 20,
    fontWeight: "700",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
