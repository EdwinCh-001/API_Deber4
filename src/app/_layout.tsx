
import { Stack } from "expo-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { createQueryClient } from "@/lib/queryClient";
import { configureOnlineManager } from "@/lib/onlineManager";

export default function RootLayout() {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    configureOnlineManager();
    return client;
  });
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: AsyncStorage,
      key: "tanstack-rick-morty-cache-v1",
      throttleTime: 1_000,
    })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 12 * 60 * 60 * 1_000,
        buster: "rick-morty-cache-v1",
      }}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: "Personajes" }}
        />
      </Stack>
    </PersistQueryClientProvider>
  );
}
