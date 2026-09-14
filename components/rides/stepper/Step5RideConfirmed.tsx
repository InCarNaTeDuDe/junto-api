import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Share,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RidePassenger } from "./types";

interface Step5RideConfirmedProps {
  from: string;
  to: string;
  pickupLocation: string;
  dropLocation: string;
  departureTimeText: string;
  vehicleModel: string;
  registrationNumber: string;
  driverName: string;
  driverAvatar: string;
  driverPhone: string;
  confirmedPassengers: RidePassenger[];
  chatMessages: Array<{
    id: string;
    sender: "driver" | "passenger";
    senderName: string;
    text: string;
    time: string;
  }>;
  onSendChatMessage: (text: string) => void;
  onCompleteStep5: () => void;
  onPrevStep: () => void;
  isDark: boolean;
  cardBg: string;
  border: string;
  textPrimary: string;
  textMute: string;
}

export function Step5RideConfirmed({
  from,
  to,
  pickupLocation,
  dropLocation,
  departureTimeText,
  vehicleModel,
  registrationNumber,
  driverName,
  driverAvatar,
  driverPhone,
  confirmedPassengers,
  chatMessages,
  onSendChatMessage,
  onCompleteStep5,
  onPrevStep,
  isDark,
  cardBg,
  border,
  textPrimary,
  textMute,
}: Step5RideConfirmedProps) {
  const [inputText, setInputText] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendChatMessage(inputText.trim());
    setInputText("");
  };

  const handleQuickChip = (msg: string) => {
    onSendChatMessage(msg);
  };

  const handleShareTrip = async () => {
    const tripDetails = `🚗 Junto Ride Confirmed!
Route: ${from} ➔ ${to}
Pickup Landmark: ${pickupLocation}
Departure Time: ${departureTimeText}
Driver: ${driverName} (${driverPhone})
Vehicle: ${vehicleModel} [${registrationNumber}]
Co-Riders: ${confirmedPassengers.map((p) => p.userName).join(", ") || "Confirmed"}
Track safely on Junto Peer-to-Peer Carpool.`;

    try {
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: `Junto Ride: ${from} to ${to}`,
            text: tripDetails,
          });
        } else {
          await navigator.clipboard.writeText(tripDetails);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        }
      } else {
        await Share.share({
          title: `Junto Ride: ${from} to ${to}`,
          message: tripDetails,
        });
      }
    } catch (err) {
      console.warn("Share error:", err);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, "")}`).catch(() => {
      Alert.alert("Call Dialing", `Dialing ${phone}...`);
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={[styles.stepIconWrap, { backgroundColor: "#10B98120" }]}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Step 5: Ride Confirmed
          </Text>
          <Text style={[styles.cardSubtitle, { color: textMute }]}>
            Confirmed driver, co-riders, trip details, Junto chat & share trip
          </Text>
        </View>
      </View>

      {/* CONFIRMED PARTICIPANTS CARDS */}
      <View
        style={[
          styles.participantsBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        <Text style={[styles.subHeading, { color: textPrimary }]}>
          👥 Confirmed Trip Members:
        </Text>

        {/* Driver Card */}
        <View style={styles.memberRow}>
          <Image source={{ uri: driverAvatar }} style={styles.avatarImg} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.memberName, { color: textPrimary }]}>
                {driverName}
              </Text>
              <View style={styles.roleTagDriver}>
                <Text style={styles.roleTagText}>Driver</Text>
              </View>
            </View>
            <Text style={[styles.memberSub, { color: textMute }]}>
              {vehicleModel ? `${vehicleModel} • ` : ""}{registrationNumber}
            </Text>
          </View>
          {driverPhone ? (
            <TouchableOpacity
              style={styles.callIconBtn}
              onPress={() => handleCall(driverPhone)}
            >
              <Ionicons name="call" size={16} color="#7C3AED" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Co-Riders Cards */}
        {confirmedPassengers.map((p, idx) => (
          <View key={p.id || idx} style={styles.memberRow}>
            <Image
              source={{
                uri: `https://images.unsplash.com/photo-${
                  1500000000000 + (idx * 345678)
                }?w=120&auto=format&fit=crop&q=80`,
              }}
              style={styles.avatarImg}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: textPrimary }]}>
                  {p.userName}
                </Text>
                <View style={styles.roleTagRider}>
                  <Text style={styles.roleTagText}>Co-Rider</Text>
                </View>
              </View>
              <Text style={[styles.memberSub, { color: "#10B981" }]}>
                📍 Pickup: {p.pickupPoint || "Main Gate"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callIconBtn}
              onPress={() => handleCall(p.passengerPhone || "+91 98765 00000")}
            >
              <Ionicons name="call" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* TRIP DETAILS MINI CARD */}
      <View
        style={[
          styles.tripDetailsBox,
          {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            borderColor: border,
          },
        ]}
      >
        <View style={styles.detailItem}>
          <Ionicons name="navigate-circle" size={18} color="#7C3AED" />
          <Text style={[styles.detailText, { color: textPrimary }]}>
            {from} ➔ {to}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={18} color="#F59E0B" />
          <Text style={[styles.detailText, { color: textPrimary }]}>
            {departureTimeText}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="pin" size={18} color="#10B981" />
          <Text style={[styles.detailText, { color: textMute }]}>
            Pickup Spot: {pickupLocation}
          </Text>
        </View>
      </View>

      {/* SHARE TRIP BUTTON */}
      <TouchableOpacity
        style={[
          styles.shareBtn,
          {
            backgroundColor: isDark
              ? "rgba(124, 58, 237, 0.2)"
              : "#EDE9FE",
            borderColor: "#7C3AED",
          },
        ]}
        onPress={handleShareTrip}
        activeOpacity={0.8}
      >
        <Ionicons name="share-social-outline" size={18} color="#7C3AED" />
        <Text style={styles.shareBtnText}>
          {shareSuccess
            ? "✓ Trip Copied to Clipboard!"
            : "Share Safe Trip with Family & Friends 🛡️"}
        </Text>
      </TouchableOpacity>

      {/* JUNTO IN-APP CHAT SECTION */}
      <View style={[styles.chatBox, { borderColor: border }]}>
        <View style={styles.chatHeader}>
          <Ionicons name="chatbubbles-outline" size={18} color="#7C3AED" />
          <Text style={[styles.chatTitle, { color: textPrimary }]}>
            Junto In-Ride Chat
          </Text>
        </View>

        {/* Chat Messages List */}
        <ScrollView style={styles.chatScrollView} nestedScrollEnabled>
          {chatMessages.map((m) => {
            const isMe = m.sender === "driver";
            return (
              <View
                key={m.id}
                style={[
                  styles.bubbleWrap,
                  isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther,
                ]}
              >
                <Text style={[styles.senderNameLabel, { color: textMute }]}>
                  {m.senderName}
                </Text>
                <View
                  style={[
                    styles.chatBubble,
                    isMe
                      ? styles.chatBubbleMe
                      : [
                          styles.chatBubbleOther,
                          {
                            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                            borderColor: border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.chatText,
                      { color: isMe ? "#FFFFFF" : textPrimary },
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text
                    style={[
                      styles.chatTime,
                      { color: isMe ? "rgba(255,255,255,0.7)" : textMute },
                    ]}
                  >
                    {m.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Message Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsRow}
        >
          {[
            "👋 I'm at the pickup spot!",
            "🚗 Leaving in 5 mins",
            "👍 Waiting near the entrance",
            "📍 Send me your landmark",
          ].map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleQuickChip(chip)}
              style={[styles.quickChip, { borderColor: border }]}
            >
              <Text style={[styles.quickChipText, { color: textMute }]}>
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat Input Row */}
        <View
          style={[
            styles.chatInputRow,
            {
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderColor: border,
            },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message to co-riders..."
            placeholderTextColor={textMute}
            style={[styles.chatInput, { color: textPrimary }]}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { opacity: inputText.trim() ? 1 : 0.6 },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: border }]}
          onPress={onPrevStep}
        >
          <Ionicons name="arrow-back" size={16} color={textPrimary} />
          <Text style={[styles.backBtnText, { color: textPrimary }]}>
            Back to Step 4
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onCompleteStep5}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.continueBtnText}>
            Ready to Start Ride (Unlock Step 6) →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  participantsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: "800",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
  },
  roleTagDriver: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagRider: {
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  memberSub: {
    fontSize: 12,
    marginTop: 2,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tripDetailsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "600",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  shareBtnText: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "700",
  },
  chatBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  chatScrollView: {
    maxHeight: 180,
    marginBottom: 8,
  },
  bubbleWrap: {
    marginBottom: 8,
  },
  bubbleWrapMe: {
    alignItems: "flex-end",
  },
  bubbleWrapOther: {
    alignItems: "flex-start",
  },
  senderNameLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  chatBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chatBubbleMe: {
    backgroundColor: "#7C3AED",
  },
  chatBubbleOther: {
    borderWidth: 1,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTime: {
    fontSize: 9,
    marginTop: 3,
    textAlign: "right",
  },
  quickChipsRow: {
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: "#7C3AED",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  continueBtn: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default Step5RideConfirmed;

