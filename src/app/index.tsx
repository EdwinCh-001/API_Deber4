
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
import { colors } from "@/theme";
import { debugLog } from "@/lib/debugLog";

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
  const favoriteCharacters =
    favorites?.filter((favorite) => favorite.isFavorite) ?? [];

  async function saveFavorite(character: Character) {
    debugLog(
      `Interfaz: inicia guardado de favorito para ${character.name} (personaje ${character.id}).`
    );
    const note = notes[character.id] ?? "";
    const validationError = getNoteValidationError(note);
    if (validationError) {
      Alert.alert("Nota inválida", validationError);
      return;
    }

    try {
      debugLog(
        `Interfaz: llamando createMutation.mutateAsync() para ${character.name} (personaje ${character.id}).`
      );
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
    debugLog(
      `Interfaz: inicia guardado de edición para ${favorite.characterName} (registro ${favorite.id}).`
    );
    const note = notes[favorite.characterId] ?? favorite.note;
    const validationError = getNoteValidationError(note);
    if (validationError) {
      Alert.alert("Nota inválida", validationError);
      return;
    }

    try {
      debugLog(
        `Interfaz: llamando updateMutation.mutateAsync() para ${favorite.characterName} (registro ${favorite.id}).`
      );
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
        <ActivityIndicator size="large" color={colors.portalBlue} />
        <Text style={styles.secondaryText}>
          {isRestoring ? "Restaurando datos guardados..." : "Cargando personajes..."}
        </Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error.message}</Text>
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
          <Text style={styles.eyebrow}>UNIVERSO MULTIDIMENSIONAL</Text>
          <Text style={styles.title}>Rick and Morty</Text>
          <Text style={styles.subtitle}>Explora los personajes de la serie</Text>
          <View style={styles.catalogBadge}>
            <Text style={styles.catalogBadgeText}>
              {data.length} PERSONAJES
            </Text>
          </View>
          {isFetching && (
            <Text style={styles.statusBadge}>
              Actualizando catálogo en segundo plano...
            </Text>
          )}
          {isError && (
            <Text style={styles.errorBadge}>
              No se pudo actualizar; se muestran los datos guardados.
            </Text>
          )}
          <View style={styles.favoritesSummary}>
            <View style={styles.favoritesHeading}>
              <Text style={styles.sectionTitle}>Mis favoritos</Text>
              {!favoritesPending && !favoritesError && (
                <Text style={styles.favoriteCount}>
                  {favoriteCharacters.length}
                </Text>
              )}
            </View>
            {favoritesPending && (
              <Text style={styles.secondaryText}>Cargando favoritos...</Text>
            )}
            {favoritesError && (
              <Text style={styles.error}>No se pudieron cargar los favoritos.</Text>
            )}
            {!favoritesPending && !favoritesError && (
              favoriteCharacters.length > 0 ? (
                <View style={styles.favoriteList}>
                  {favoriteCharacters.map((favorite) => (
                    <View key={favorite.id} style={styles.favoriteRow}>
                      <View style={styles.favoriteDot} />
                      <Text style={styles.favoriteName}>
                        {favorite.characterName}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.secondaryText}>
                  Aún no tienes personajes favoritos.
                </Text>
              )
            )}
            {pendingMutations.length > 0 && (
              <Text style={styles.pending}>
                {pendingMutations.some(Boolean)
                  ? `${pendingMutations.length} cambio(s) pendiente(s): se enviarán al recuperar la conexión.`
                  : "Guardando cambios..."}
              </Text>
            )}
          </View>
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
              <Text style={styles.metadata}>Especie · {item.species}</Text>
              <Text style={styles.metadata}>Estado · {item.status}</Text>

              {favorite && !isEditingFavorite ? (
                <Text style={styles.note}>
                  Nota: {favorite.note || "Sin nota"}
                </Text>
              ) : (
                <View style={styles.noteInputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe una nota..."
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.portalBlue}
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
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    debugLog(
                      `Usuario presionó Añadir favorito para ${item.name} (personaje ${item.id}).`
                    );
                    void saveFavorite(item);
                  }}
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
                style={({ pressed }) => [
                  styles.editIcon,
                  pressed && styles.editIconPressed,
                  editingFavoriteId !== null &&
                    !isEditingFavorite &&
                    styles.editIconDisabled,
                ]}
                onPress={() => {
                  if (isEditingFavorite) {
                    debugLog(
                      `Usuario presionó Guardar edición de favorito para ${favorite.characterName} (registro ${favorite.id}).`
                    );
                    void editFavorite(favorite);
                    return;
                  }

                  debugLog(
                    `Usuario abrió la edición del favorito ${favorite.characterName} (registro ${favorite.id}).`
                  );
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
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 112,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 28,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 24,
    gap: 10,
  },
  eyebrow: {
    color: colors.portalGreen,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  catalogBadge: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(0, 181, 216, 0.09)",
  },
  catalogBadgeText: {
    color: colors.portalBlue,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised,
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    color: colors.error,
    fontSize: 12,
  },
  favoritesSummary: {
    marginTop: 12,
    padding: 16,
    gap: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  favoritesHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  favoriteCount: {
    minWidth: 30,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(166, 226, 46, 0.12)",
    color: colors.portalGreen,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  favoriteList: {
    gap: 9,
    marginTop: 3,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 24,
  },
  favoriteDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.portalGreen,
  },
  favoriteName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  pending: {
    color: colors.warning,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  secondaryText: {
    color: colors.textSecondary,
    marginLeft: 0,
  },
  error: {
    color: colors.error,
    textAlign: "center",
  },
  card: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: 112,
    height: 148,
  },
  info: {
    flex: 1,
    justifyContent: "center",
    padding: 14,
    paddingRight: 48,
    gap: 7,
  },
  name: {
    color: colors.portalBlue,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  metadata: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontSize: 13,
  },
  noteInputGroup: {
    gap: 6,
  },
  button: {
    backgroundColor: colors.portalBlue,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  noteCounter: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  validationError: {
    color: colors.error,
    fontSize: 12,
  },
  editIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  editIconDisabled: {
    opacity: 0.4,
  },
  editIconPressed: {
    backgroundColor: "#202C38",
    transform: [{ scale: 0.95 }],
  },
  editIconText: {
    color: colors.portalGreen,
    fontSize: 20,
    fontWeight: "700",
  },
  buttonText: {
    color: colors.background,
    fontWeight: "600",
    textAlign: "center",
  },
});
