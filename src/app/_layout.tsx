
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  createQueryClient,
  resumePausedMutations,
} from "@/lib/queryClient";
import { configureOnlineManager } from "@/lib/onlineManager";
import { debugLog } from "@/lib/debugLog";
import { colors } from "@/theme";

function CacheRestorationLogger() {
  useEffect(() => {
    debugLog("Inicia restauración de caché persistida.");
  }, []);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    configureOnlineManager(client);
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
      onSuccess={() => {
        debugLog("Finaliza restauración de caché persistida.");
        return resumePausedMutations(queryClient, "caché restaurada");
      }}
    >
      <CacheRestorationLogger />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Rick and Morty",
            headerTransparent: true,
            headerTintColor: colors.portalGreen,
            headerTitleStyle: {
              color: colors.portalBlue,
              fontWeight: "700",
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Header
            blurEffect="systemMaterial"
            style={{
              backgroundColor: "rgba(18, 24, 32, 0.86)",
              shadowColor: "transparent",
            }}
          />
        </Stack.Screen>
      </Stack>
    </PersistQueryClientProvider>
  );
}
