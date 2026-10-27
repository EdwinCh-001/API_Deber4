export interface Favorite{
    id: string;
    characterId:number;
    characterName: string;
    note: string;
    isFavorite: boolean;
}

export type CreateFavorite = Omit<Favorite, "id">;
