import * as Network from "expo-network";
import { onlineManager, type QueryClient } from "@tanstack/react-query";
import { debugLog } from "@/lib/debugLog";
import { resumePausedMutations } from "@/lib/queryClient";

function isInternetAvailable(state: Network.NetworkState) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function configureOnlineManager(queryClient: QueryClient) {
  debugLog("Inicio de la aplicación: configurando onlineManager con Expo Network.");
  onlineManager.setEventListener((setOnline) => {
    let active = true;
    let eventCount = 0;
    let previousOnlineState: boolean | undefined;

    // Keep requests and mutations paused until Expo Network reports a state.
    setOnline(false);

    function updateOnlineState(state: Network.NetworkState) {
      const online = isInternetAvailable(state);
      const changed = previousOnlineState !== online;
      previousOnlineState = online;
      setOnline(online);

      if (!changed) {
        return;
      }

      debugLog(`Estado de red: ${online ? "ONLINE" : "OFFLINE"}`);
      if (online) {
        void resumePausedMutations(queryClient, "conexión restablecida").catch(
          () => undefined
        );
      }
    }

    const subscription = Network.addNetworkStateListener((state) => {
      eventCount += 1;
      updateOnlineState(state);
    });

    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && eventCount === 0) {
          updateOnlineState(state);
        }
      })
      .catch((error: unknown) => {
        debugLog(
          `No se pudo consultar el estado inicial de red: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        if (active && eventCount === 0) {
          updateOnlineState({
            isConnected: false,
            isInternetReachable: false,
            type: Network.NetworkStateType.NONE,
          });
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  });
}
