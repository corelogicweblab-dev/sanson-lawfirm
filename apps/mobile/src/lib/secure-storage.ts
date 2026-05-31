import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "sanson_auth_token";
const USER_KEY = "sanson_user_json";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUserJson(json: string) {
  await SecureStore.setItemAsync(USER_KEY, json);
}

export async function getUserJson(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_KEY);
}

/** Biometric-ready: swap for expo-local-authentication before reading token. */
export const biometricAuthReady = true;
