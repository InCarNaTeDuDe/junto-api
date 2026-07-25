import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

export interface AskNearbyFormProps {
  colors?: any;
  selectedLocation?: string;
  onSubmitSuccess?: (data: any) => void;
}

const ASK_CATEGORIES = [
  "Recommendations",
  "Lost & Found",
  "Community Q&A",
  "Borrow Item",
  "Local Advice",
];

export const AskNearbyForm: React.FC<AskNearbyFormProps> = ({
  selectedLocation = "Downtown Area",
  onSubmitSuccess,
}) => {
  const [question, setQuestion] = useState<string>("");
  const [category, setCategory] = useState<string>("Recommendations");
  const [urgency, setUrgency] = useState<string>("Normal");
  const [radius, setRadius] = useState<number>(5);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      const msg = "Please enter your question or announcement.";
      if (typeof window !== "undefined" && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert("Validation Error", msg);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: "ask_nearby",
        question,
        category,
        urgency,
        radius,
        anonymous,
        location: selectedLocation,
        createdAt: new Date().toISOString(),
      };

      await new Promise((resolve) => setTimeout(resolve, 600));

      const message = `Asked nearby community within ${radius}km: "${question.substring(0, 30)}..."`;
      if (typeof window !== "undefined" && window.alert) {
        window.alert(message);
      } else {
        Alert.alert("Success", message);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }

      setQuestion("");
      setCategory("Recommendations");
      setUrgency("Normal");
      setRadius(5);
      setAnonymous(false);
    } catch (error) {
      const errMsg = "Failed to submit question. Please try again.";
      if (typeof window !== "undefined" && window.alert) {
        window.alert(errMsg);
      } else {
        Alert.alert("Error", errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ask Nearby Community 🗣️</Text>

      {/* Question Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Your Question or Post <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Best local coffee spot with quiet WiFi for working?"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
          value={question}
          onChangeText={setQuestion}
        />
      </View>

      {/* Category Chips */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {ASK_CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
                activeOpacity={0.7}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Urgency & Radius */}
      <View style={styles.rowTwoCols}>
        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.chipRow}>
            {["Normal", "Urgent"].map((u) => {
              const isSelected = urgency === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  onPress={() => setUrgency(u)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.flexOne]}>
          <Text style={styles.label}>Search Radius</Text>
          <View style={styles.stepperBox}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setRadius(Math.max(1, radius - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperVal}>{radius} km</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setRadius(Math.min(50, radius + 1))}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Post Anonymously */}
      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Post Anonymously</Text>
          <Text style={styles.sublabel}>
            Hide your name & avatar on this query
          </Text>
        </View>
        <Switch
          value={anonymous}
          onValueChange={setAnonymous}
          trackColor={{ true: "#6366f1" }}
        />
      </View>

      {/* Location */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Location</Text>
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>📍 {selectedLocation}</Text>
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
        activeOpacity={0.8}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitBtnText}>Ask Nearby Community</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 12,
    color: "#64748b",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: "#eef2ff",
    borderColor: "#6366f1",
  },
  chipUnselected: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  flexOne: {
    flex: 1,
  },
  stepperBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  stepperVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 4,
  },
  locationBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  locationText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
