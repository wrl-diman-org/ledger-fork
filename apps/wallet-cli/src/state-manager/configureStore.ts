import { configureStore } from "@reduxjs/toolkit";
import { AuthSDK } from "@ledgerhq/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { setSwapQuotesStore } from "@domain/api-swap-quotes/store";
import { swapApi, swapApiExtra } from "@shared/api-services";
import { authApiExtra } from "@shared/auth";
import { loadApiAuthIdentity } from "../key-ring/api-auth-identity";
import { createAuthFetch } from "./auth-fetch";

export type WalletCliStoreConfig = {
  auth: { clientId: string; keycloakBaseUrl: string; keycloakRealm: string };
  getSwapApiBaseUrl: () => string;
  ledgerClientVersion: string;
};

/**
 * Builds the Redux store behind `getQuotes` and registers its dispatch. Called once per CLI run, so
 * the in-memory token and the Keycloak cookie jar never outlive the command.
 */
export function setupWalletCliStore(config: WalletCliStoreConfig) {
  const store = configureStore({
    reducer: {
      [swapApi.reducerPath]: swapApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: {
          extraArgument: {
            ...swapApiExtra({
              getSwapApiBaseUrl: config.getSwapApiBaseUrl,
              ledgerClientVersion: config.ledgerClientVersion,
            }),
            ...authApiExtra({
              isFeatureEnabled: () => true,
              authProvider: new AuthSDK(
                { ...config.auth, disablePkce: true },
                {
                  provider: new LkrpIdentityProvider(loadApiAuthIdentity),
                  fetch: createAuthFetch(),
                },
              ),
            }),
          },
        },
      }).concat(swapApi.middleware),
  });

  setSwapQuotesStore(store.dispatch);
}
