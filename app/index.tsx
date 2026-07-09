import { Redirect } from "expo-router";
import { useAuthContext } from "@/context/AuthContext";

export default function Index() {
  const { isLoggedIn } = useAuthContext();

  return isLoggedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
