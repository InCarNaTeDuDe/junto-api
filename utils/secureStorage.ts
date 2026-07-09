import * as SecureStore from "expo-secure-store";

const JWT_KEY = "jwtToken";

export async function saveJwtToken(token: string) {
  await SecureStore.setItemAsync(JWT_KEY, token);
}

export async function getJwtToken() {
  return await SecureStore.getItemAsync(JWT_KEY);
}

export async function removeJwtToken() {
  await SecureStore.deleteItemAsync(JWT_KEY);
}
