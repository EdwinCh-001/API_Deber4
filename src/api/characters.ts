import type { Character, CharacterResponse } from "@/types/characters"

const API_URL = (
    process.env.EXPO_PUBLIC_API_URL || "https://rickandmortyapi.com/api"
).replace(/\/+$/, "");

export async function getCharacters(): Promise<Character[]> {
    const response = await fetch(`${API_URL}/character`);

    if (!response.ok){
        throw new Error("No se pudieron cargar los personajes")
    }

    const data: CharacterResponse = await response.json();

    return data.results;
}
