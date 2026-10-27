import * as Network from "expo-network";
import { onlineManager } from "@tanstack/react-query";

function isInternetAvailable(state: Network.NetworkState) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function configureOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    let active = true;
    let eventCount = 0;

    // Keep requests and mutations paused until Expo Network reports a state.
    setOnline(false);

    const subscription = Network.addNetworkStateListener((state) => {
      eventCount += 1;
      setOnline(isInternetAvailable(state));
    });

    void Network.getNetworkStateAsync()
      .then((state) => {
        if (active && eventCount === 0) {
          setOnline(isInternetAvailable(state));
        }
      })
      .catch((error: unknown) => {
        console.error("No se pudo consultar el estado de la red.", error);
        if (active && eventCount === 0) {
          setOnline(false);
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  });
}
