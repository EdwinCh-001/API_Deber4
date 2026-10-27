export interface Character{
    id: number,
    name: string,
    species: string,
    image: string,
    status: string,
}

export interface CharacterResponse{
    results: Character[];
}
