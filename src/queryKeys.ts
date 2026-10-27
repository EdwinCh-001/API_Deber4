export const queryKeys = {
    characters: {
        all: ["characters"] as const,
        lists: () => [...queryKeys.characters.all, "list"] as const,
        list: () => [...queryKeys.characters.lists()] as const,
        details: () => [...queryKeys.characters.all, "detail"] as const,
        detail: (id: number) =>
            [...queryKeys.characters.details(), id] as const,
    },

    favorites: {
        all: ["favorites"] as const,
        lists: () => [...queryKeys.favorites.all, "list"] as const,
        list: () => [...queryKeys.favorites.lists()] as const,
        details: () => [...queryKeys.favorites.all, "detail"] as const,
        detail: (id: string) =>
            [...queryKeys.favorites.details(), id] as const,
    },

    mutations: {
        createFavorite: ["mutations", "favorites", "create"] as const,
        updateFavorite: ["mutations", "favorites", "update"] as const,
    },
};