import type { Character, CharacterResponse } from "@/types/characters"
import { debugLog, getErrorMessage } from "@/lib/debugLog";

const API_URL = (
    process.env.EXPO_PUBLIC_API_URL || "https://rickandmortyapi.com/api"
).replace(/\/+$/, "");

export async function getCharacters(): Promise<Character[]> {
    debugLog("Consulta del catálogo: inicia getCharacters().");
    try {
        const response = await fetch(`${API_URL}/character`);

        if (!response.ok){
            throw new Error("No se pudieron cargar los personajes")
        }

        const data: CharacterResponse = await response.json();

        debugLog(`Consulta del catálogo exitosa: ${data.results.length} personajes.`);
        return data.results;
    } catch (error) {
        debugLog(`Consulta del catálogo falló: ${getErrorMessage(error)}`);
        throw error;
    }
}
