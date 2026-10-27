import type { Favorite, CreateFavorite } from "@/types/favorites";

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
    const response = await fetch(getUrl());
    await ensureSuccessfulResponse(response, "No se pudieron cargar los favoritos");

    const favorites: Favorite[] = await response.json();

    return favorites.map(normalizeFavorite);
}

export async function createFavorite(
    favorite: CreateFavorite
): Promise<Favorite> {
    const response = await fetch(getUrl(), {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify(favorite),
    });

    await ensureSuccessfulResponse(response, "No se pudo crear el favorito");

    const created: Favorite = await response.json();
    return normalizeFavorite(created);
}

export async function updateFavorite(
    favorite: Favorite,
    changes: Partial<CreateFavorite>
): Promise<Favorite> {
    const { id, ...existingFields } = favorite;
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
        }
    );

    await ensureSuccessfulResponse(response, "No se pudo editar el favorito");

    const updated: Favorite = await response.json();
    return normalizeFavorite(updated);
}
