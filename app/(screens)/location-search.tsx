import { useAuthContext } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { CITIES } from "@/data/cities";
import { useTheme } from "@/hooks/useTheme";
import { requestCurrentLocation } from "@/services/locationServices";
import { Theme } from "@/theme";
import { saveSelectedLocation } from "@/utils/secureStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationSearch() {
  const { theme: t, isDark } = useTheme();

  const s = useMemo(() => createStyles(t), [t]);

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
    <SafeAreaView edges={["top", "left", "right"]} style={s.wrapper}>
      {/* Header */}

      <View style={s.container}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={t.text} size={24} />
        </Pressable>

        <Text style={s.heading}>Search Location</Text>
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
          style={s.input_location}
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
            style={s.location_icon}
          >
            <Ionicons name="location-outline" color={t.text} size={22} />

            <View
              style={{
                marginLeft: 14,
                borderColor: "red",
              }}
            >
              <Text style={s.cityname_result}>
                {item.name}, {item.state}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: t.bg,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    heading: {
      color: t.text,
      fontSize: 22,
      fontWeight: "700",
      marginLeft: 14,
    },
    input_location: {
      flex: 1,
      marginLeft: 10,

      color: t.text,
      fontSize: 16,
      fontWeight: "500",
    },
    location_icon: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    cityname_result: {
      color: t.text,
      marginTop: 2,
    },
  });
