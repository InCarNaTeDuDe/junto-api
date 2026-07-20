import { useAuthContext } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { CITIES } from "@/data/cities";
import { requestCurrentLocation } from "@/services/locationServices";
import { saveSelectedLocation } from "@/utils/secureStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationSearch() {
  const { theme } = useAuthContext();
  const [search, setSearch] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const { setSelectedLocation } = useLocation();

  const filtered = CITIES.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase()),
  );

  const useCurrentLocation = async () => {
    if (locationLoading) return;
    try {
      setLocationLoading(true);

      const location = await requestCurrentLocation();
      const obj = {
        name: location.locality,
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setSelectedLocation(obj);
      await saveSelectedLocation(obj);

      router.back();

      /**
       * Later
       *
       * fetchActivities(
       *    location.latitude,
       *    location.longitude
       * )
       */
    } catch (e: any) {
      switch (e.message) {
        case "LOCATION_DISABLED":
          // User was already sent to GPS settings.
          // Don't show another alert.
          break;

        case "LOCATION_PERMISSION_DENIED":
          Alert.alert(
            "Permission Required",
            "Please allow location access to detect your current city.",
          );
          break;

        default:
          Alert.alert(
            "Location Error",
            "Couldn't detect your location. Please search manually.",
          );
      }
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]}>
      {/* Header */}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 16,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginLeft: 14,
          }}
        >
          Search Location
        </Text>
      </View>

      {/* Current */}

      <Pressable
        onPress={useCurrentLocation}
        disabled={locationLoading}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 16,
          opacity: locationLoading ? 0.7 : 1,
        }}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons name="locate" size={22} color={theme.primary} />
        )}

        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.text,
            }}
          >
            {locationLoading
              ? "Detecting your location..."
              : "Use Current Location"}
          </Text>

          <Text
            style={{
              color: theme.sub,
              marginTop: 2,
            }}
          >
            {locationLoading
              ? "Finding nearby activities..."
              : "Detect using GPS"}
          </Text>
        </View>
      </Pressable>
      {/* Search */}

      {/* ================= Search ================= */}

      <View
        style={{
          marginHorizontal: 18,
          marginTop: 12,
          marginBottom: 16,

          height: 52,

          flexDirection: "row",
          alignItems: "center",

          backgroundColor: theme.inputBg,

          borderWidth: 1,
          borderColor: theme.inputBorder,

          borderRadius: 14,

          paddingHorizontal: 14,
        }}
      >
        <Ionicons name="search" size={20} color={theme.icon} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search city"
          placeholderTextColor={theme.placeholder}
          autoFocus
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          style={{
            flex: 1,
            marginLeft: 10,

            color: theme.text,
            fontSize: 16,
            fontWeight: "500",
          }}
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={theme.mute} />
          </Pressable>
        )}
      </View>

      {/* ========================================== */}

      {/* Results */}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={async () => {
              console.log("SELECTED:", item);

              setSelectedLocation({
                name: item.name,
                city: item.name, // since you're selecting cities only
                state: item.state,
                latitude: item.latitude,
                longitude: item.longitude,
              });
              await saveSelectedLocation({
                name: item.name,
                state: item.state,
                latitude: item.latitude,
                longitude: item.longitude,
              });

              router.back();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingVertical: 16,
            }}
          >
            <Ionicons name="location-outline" size={22} />

            <View
              style={{
                marginLeft: 14,
              }}
            >
              <Text
                style={{
                  color: "#777",
                  marginTop: 2,
                }}
              >
                {item.name}, {item.state}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
