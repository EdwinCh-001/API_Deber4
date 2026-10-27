import type { Favorite, CreateFavorite } from "@/types/favorites";
import { debugLog, getErrorMessage } from "@/lib/debugLog";

const API_URL = process.env.EXPO_PUBLIC_MOCKAPI_URL;
const FAVORITES_PATH = "/favorites";

function getUrl() {
    if (!API_URL) {
        throw new Error(
            "Falta configurar EXPO_PUBLIC_MOCKAPI_URL con la URL base de MockAPI."
        );
    }

    return `${API_URL.replace(/\/+$/, "")}${FAVORITES_PATH}`;
}

async function ensureSuccessfulResponse(
    response: Response,
    action: string
): Promise<void> {
    if (!response.ok) {
        const details = (await response.text()).trim();
        throw new Error(
            `${action} (HTTP ${response.status})${details ? `: ${details}` : ""}`
        );
    }
}

function normalizeFavorite(favorite: Favorite): Favorite {
    return {
        ...favorite,
        characterId: Number(favorite.characterId),
    };
}

export async function getFavorites(): Promise<Favorite[]> {
    debugLog("Consulta de favoritos: inicia getFavorites().");
    try {
        const response = await fetch(getUrl());
        await ensureSuccessfulResponse(response, "No se pudieron cargar los favoritos");

        const favorites: Favorite[] = await response.json();

        const normalizedFavorites = favorites.map(normalizeFavorite);
        debugLog(`Consulta de favoritos exitosa: ${normalizedFavorites.length} favoritos.`);
        return normalizedFavorites;
    } catch (error) {
        debugLog(`Consulta de favoritos falló: ${getErrorMessage(error)}`);
        throw error;
    }
}

export async function createFavorite(
    favorite: CreateFavorite
): Promise<Favorite> {
    debugLog(
        `API createFavorite(): inicio de petición POST para ${favorite.characterName} (personaje ${favorite.characterId}).`
    );
    try {
        const response = await fetch(getUrl(), {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify(favorite),
        });

        debugLog(
            `Creación de favorito: MockAPI recibió la petición (HTTP ${response.status}).`
        );
        await ensureSuccessfulResponse(response, "No se pudo crear el favorito");

        const created: Favorite = normalizeFavorite(await response.json());
        debugLog("Creación de favorito: MockAPI respondió exitosamente.");
        return created;
    } catch (error) {
        debugLog(`Creación de favorito falló: ${getErrorMessage(error)}`);
        throw error;
    }
}

export async function updateFavorite(
    favorite: Favorite,
    changes: Partial<CreateFavorite>
): Promise<Favorite> {
    debugLog(
        `API updateFavorite(): inicio de petición PUT para ${favorite.characterName} (registro ${favorite.id}).`
    );
    const { id, ...existingFields } = favorite;
    try {
        const response = await fetch(
            `${getUrl()}/${encodeURIComponent(id)}`,
            {
                // MockAPI's resource update endpoint expects a complete PUT body.
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...existingFields,
                    ...changes,
                }),
            },
        );

        debugLog(
            `Edición de favorito: MockAPI recibió la petición (HTTP ${response.status}).`
        );
        await ensureSuccessfulResponse(response, "No se pudo editar el favorito");

        const updated = normalizeFavorite(await response.json());
        debugLog("Edición de favorito: MockAPI respondió exitosamente.");
        return updated;
    } catch (error) {
        debugLog(`Edición de favorito falló: ${getErrorMessage(error)}`);
        throw error;
    }
}
