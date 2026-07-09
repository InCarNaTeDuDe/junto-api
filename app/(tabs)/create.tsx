// @ts-nocheck
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";

interface CreateModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectOption?: (optionId: string) => void;
}

export default function CreateModal({
  isOpen,
  onClose,
  onSelectOption,
}: CreateModalProps) {
  const { height } = useWindowDimensions();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Form states for each flow
  // 👥 Find Day Mates
  const [dayMateActivity, setDayMateActivity] = useState("Cricket");
  const [dayMateTime, setDayMateTime] = useState("Today Evening");
  const [dayMateMatesNeeded, setDayMateMatesNeeded] = useState(2);

  // 🎟️ Sell Ticket
  const [ticketEventName, setTicketEventName] = useState("");
  const [ticketOrigPrice, setTicketOrigPrice] = useState("");
  const [ticketSellPrice, setTicketSellPrice] = useState("");
  const [ticketQty, setTicketQty] = useState(1);

  // 🎉 Host Event
  const [hostEventName, setHostEventName] = useState("");
  const [hostLocation, setHostLocation] = useState("");
  const [hostType, setHostType] = useState("Turf Game");
  const [hostMaxPeople, setHostMaxPeople] = useState(15);

  // 📢 Ask Something Nearby
  const [askQuestion, setAskQuestion] = useState("");
  const [askTopic, setAskTopic] = useState("Crowds");
  const [askUrgency, setAskUrgency] = useState("Normal");

  const options = [
    {
      id: "day_mates",
      emoji: "👥",
      title: "Find Day Mates",
      description: "Meet people for cricket, lunch, coffee, or movies today.",
      icon: "calendar-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#1C1917", // Rich charcoal near-black
    },
    {
      id: "sell_ticket",
      emoji: "🎟️",
      title: "Sell Ticket",
      description: "Sell last-minute extra tickets to people nearby securely.",
      icon: "ticket-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#F59E0B", // Vibrant orange
    },
    {
      id: "host_event",
      emoji: "🎉",
      title: "Host Event",
      description: "Organize pub crawls, turf games, or community mixers.",
      icon: "ribbon-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#A78BFA", // Beautiful lavender violet
    },
    {
      id: "ask_nearby",
      emoji: "📢",
      title: "Ask Something Nearby",
      description: "Ask questions about crowds, entry-fees, or recommend bars.",
      icon: "megaphone-outline" as keyof typeof Ionicons.glyphMap,
      iconBg: "#3B82F6", // Clean active blue
    },
  ];

  const handleOptionClick = (id: string) => {
    setSelectedOption(id);
  };

  const handleFormSubmit = () => {
    if (onSelectOption && selectedOption) {
      onSelectOption(selectedOption);
    }
    // Clean up local flow state and dismiss sheet
    setSelectedOption(null);
    onClose?.();
  };

  const handleBack = () => {
    setSelectedOption(null);
  };

  const handleModalClose = () => {
    setSelectedOption(null);
    onClose?.();
  };

  // Switch-based renderer for form controls and data points
  const renderFormContent = () => {
    switch (selectedOption) {
      case "day_mates":
        return (
          <View style={s.formWrapper}>
            <Text style={s.sectionSubtitle}>
              Set up match details to meet up today
            </Text>

            {/* Activity Selector */}
            <Text style={s.label}>Select Activity</Text>
            <View style={s.chipRow}>
              {[
                "Cricket 🏏",
                "Coffee ☕",
                "Lunch 🍕",
                "Movie 🎬",
                "Drinks 🍺",
              ].map((act) => {
                const isSelected = dayMateActivity === act;
                return (
                  <TouchableOpacity
                    key={act}
                    activeOpacity={0.8}
                    style={[s.chip, isSelected && s.chipSelected]}
                    onPress={() => setDayMateActivity(act)}
                  >
                    <Text
                      style={[s.chipText, isSelected && s.chipTextSelected]}
                    >
                      {act}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Slot Selector */}
            <Text style={s.label}>Preferred Time Slot</Text>
            <View style={s.chipRow}>
              {["Today Afternoon", "Today Evening", "Tonight"].map((t) => {
                const isSelected = dayMateTime === t;
                return (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.8}
                    style={[s.chip, isSelected && s.chipSelected]}
                    onPress={() => setDayMateTime(t)}
                  >
                    <Text
                      style={[s.chipText, isSelected && s.chipTextSelected]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Number of Day Mates needed Counter */}
            <Text style={s.label}>Mates Needed</Text>
            <View style={s.counterRow}>
              <Text style={s.counterLabel}>
                How many people would you like to join?
              </Text>
              <View style={s.counterControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() =>
                    setDayMateMatesNeeded(Math.max(1, dayMateMatesNeeded - 1))
                  }
                >
                  <Text style={s.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{dayMateMatesNeeded}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() =>
                    setDayMateMatesNeeded(Math.min(10, dayMateMatesNeeded + 1))
                  }
                >
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.submitBtn, { backgroundColor: "#1C1917" }]}
              onPress={handleFormSubmit}
            >
              <Text style={s.submitBtnText}>Find Day Mates 👥</Text>
            </TouchableOpacity>
          </View>
        );

      case "sell_ticket":
        return (
          <View style={s.formWrapper}>
            <Text style={s.sectionSubtitle}>
              Enter ticket pricing & availability details
            </Text>

            {/* Event Name Input */}
            <Text style={s.label}>Event / Movie Name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Coldplay Music of the Spheres"
              placeholderTextColor="#94A3B8"
              value={ticketEventName}
              onChangeText={setTicketEventName}
            />

            {/* Pricing Input Fields */}
            <View style={s.rowFields}>
              <View style={{ flex: 1, marginRight: scale(10) }}>
                <Text style={s.label}>Original Price (₹)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g., 5000"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                  value={ticketOrigPrice}
                  onChangeText={setTicketOrigPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Selling Price (₹)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g., 3500"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                  value={ticketSellPrice}
                  onChangeText={setTicketSellPrice}
                />
              </View>
            </View>

            {/* Quantity Counter */}
            <Text style={s.label}>Ticket Quantity</Text>
            <View style={s.counterRow}>
              <Text style={s.counterLabel}>
                How many extra tickets are you selling?
              </Text>
              <View style={s.counterControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() => setTicketQty(Math.max(1, ticketQty - 1))}
                >
                  <Text style={s.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{ticketQty}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() => setTicketQty(Math.min(8, ticketQty + 1))}
                >
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.submitBtn, { backgroundColor: "#F59E0B" }]}
              onPress={handleFormSubmit}
              disabled={!ticketEventName}
            >
              <Text style={s.submitBtnText}>Post Ticket Deal 🎟️</Text>
            </TouchableOpacity>
          </View>
        );

      case "host_event":
        return (
          <View style={s.formWrapper}>
            <Text style={s.sectionSubtitle}>
              Host social mixers, games or mixers
            </Text>

            {/* Event Name */}
            <Text style={s.label}>Event Title</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Koramangala Friday Pub Crawl"
              placeholderTextColor="#94A3B8"
              value={hostEventName}
              onChangeText={setHostEventName}
            />

            {/* Location Spot */}
            <Text style={s.label}>Venue / Spot Location</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Astro Arena Turf, Toit"
              placeholderTextColor="#94A3B8"
              value={hostLocation}
              onChangeText={setHostLocation}
            />

            {/* Event Type selector */}
            <Text style={s.label}>Event Category</Text>
            <View style={s.chipRow}>
              {[
                "Turf Game ⚽",
                "Pub Crawl 🍻",
                "Social Mixer 🎨",
                "Board Games ♟️",
              ].map((type) => {
                const isSelected = hostType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    style={[s.chip, isSelected && s.chipSelected]}
                    onPress={() => setHostType(type)}
                  >
                    <Text
                      style={[s.chipText, isSelected && s.chipTextSelected]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Max spots / Capacity */}
            <Text style={s.label}>Expected Spot Limit</Text>
            <View style={s.counterRow}>
              <Text style={s.counterLabel}>Maximum attendees invited?</Text>
              <View style={s.counterControls}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() =>
                    setHostMaxPeople(Math.max(5, hostMaxPeople - 5))
                  }
                >
                  <Text style={s.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={s.counterVal}>{hostMaxPeople}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={s.counterBtn}
                  onPress={() =>
                    setHostMaxPeople(Math.min(100, hostMaxPeople + 5))
                  }
                >
                  <Text style={s.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.submitBtn, { backgroundColor: "#A78BFA" }]}
              onPress={handleFormSubmit}
              disabled={!hostEventName || !hostLocation}
            >
              <Text style={s.submitBtnText}>Launch Community Event 🎉</Text>
            </TouchableOpacity>
          </View>
        );

      case "ask_nearby":
        return (
          <View style={s.formWrapper}>
            <Text style={s.sectionSubtitle}>
              Broadcast localized question to active users
            </Text>

            {/* Custom Question input */}
            <Text style={s.label}>Your Question</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              multiline={true}
              numberOfLines={3}
              placeholder="e.g., Is the entry fee at Toit active tonight? How crowded is the turf right now?"
              placeholderTextColor="#94A3B8"
              value={askQuestion}
              onChangeText={setAskQuestion}
            />

            {/* Quick Topic Chips */}
            <Text style={s.label}>Select Topic</Text>
            <View style={s.chipRow}>
              {[
                "Crowds 🔥",
                "Entry Fees 💸",
                "Bars & Food 🍺",
                "Parking Info 🚗",
              ].map((topic) => {
                const isSelected = askTopic === topic;
                return (
                  <TouchableOpacity
                    key={topic}
                    activeOpacity={0.8}
                    style={[s.chip, isSelected && s.chipSelected]}
                    onPress={() => setAskTopic(topic)}
                  >
                    <Text
                      style={[s.chipText, isSelected && s.chipTextSelected]}
                    >
                      {topic}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Urgency selection */}
            <Text style={s.label}>Urgency Level</Text>
            <View style={s.chipRow}>
              {["Normal Info", "Urgent Broadcast ⚡"].map((urg) => {
                const isSelected = askUrgency === urg;
                return (
                  <TouchableOpacity
                    key={urg}
                    activeOpacity={0.8}
                    style={[s.chip, isSelected && s.chipSelected]}
                    onPress={() => setAskUrgency(urg)}
                  >
                    <Text
                      style={[s.chipText, isSelected && s.chipTextSelected]}
                    >
                      {urg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.submitBtn, { backgroundColor: "#3B82F6" }]}
              onPress={handleFormSubmit}
              disabled={!askQuestion}
            >
              <Text style={s.submitBtnText}>Broadcast Question 📢</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={handleModalClose}
    >
      <View style={s.modalContainer}>
        {/* Backdrop overlay */}
        <Pressable style={s.backdropOverlay} onPress={handleModalClose} />

        {/* Sliding Sheet */}
        <View style={[s.sheet, { maxHeight: height * 0.95 }]}>
          {/* Pull Handle Affordance */}
          <View style={s.dragHandle} />

          {/* Header Title, Back Button, & Close Button */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {selectedOption && (
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    s.backBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={moderateScale(20)}
                    color="#0F0A24"
                  />
                </Pressable>
              )}
              <Text
                style={[
                  s.headerTitle,
                  selectedOption ? { marginLeft: scale(8) } : null,
                ]}
              >
                {selectedOption
                  ? options.find((o) => o.id === selectedOption)?.title
                  : "What would you like to do today?"}
              </Text>
            </View>
            <Pressable
              onPress={handleModalClose}
              style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.7 }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={moderateScale(22)} color="#64748B" />
            </Pressable>
          </View>

          {/* Conditionally rendered Options List or Form Content */}
          {!selectedOption ? (
            <ScrollView
              style={s.list}
              contentContainerStyle={{ paddingBottom: verticalScale(36) }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [
                    s.cardContainer,
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => handleOptionClick(opt.id)}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        s.card,
                        pressed && { backgroundColor: "#F1F5F9" },
                      ]}
                    >
                      {/* Rounded Icon Box */}
                      <View
                        style={[s.iconBox, { backgroundColor: opt.iconBg }]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={moderateScale(24)}
                          color="#FFFFFF"
                        />
                      </View>

                      {/* Title & Description Column */}
                      <View style={s.metaColumn}>
                        <View style={s.titleRow}>
                          <Text style={s.emoji}>{opt.emoji}</Text>
                          <Text style={s.titleText}>{opt.title}</Text>
                        </View>
                        <Text style={s.descText}>{opt.description}</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              style={s.formScroll}
              contentContainerStyle={{ paddingBottom: verticalScale(40) }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderFormContent()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#0F0A24",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
  },
  android: {
    elevation: 8,
  },
  default: {},
});

const s = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 10, 36, 0.45)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(36),
    borderTopRightRadius: moderateScale(36),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
    ...shadow,
  },
  dragHandle: {
    width: scale(56),
    height: verticalScale(5),
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    alignSelf: "center",
    marginTop: verticalScale(12),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    paddingVertical: verticalScale(16),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontWeight: "900",
    color: "#0F0A24",
    fontSize: moderateScale(17),
    flex: 1,
  },
  backBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(4),
  },
  closeBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    marginTop: verticalScale(12),
  },
  cardContainer: {
    width: "100%",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: verticalScale(12),
    padding: moderateScale(16),
    alignItems: "center", // Perfect alignment next to the icon
  },
  iconBox: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(14),
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  metaColumn: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  emoji: {
    marginRight: scale(6),
    fontSize: moderateScale(18),
  },
  titleText: {
    fontWeight: "900",
    color: "#0F0A24",
    fontSize: moderateScale(15),
  },
  descText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(17.5),
  },

  // Interactive Form Styles
  formScroll: {
    marginTop: verticalScale(8),
  },
  formWrapper: {
    paddingVertical: verticalScale(8),
  },
  sectionSubtitle: {
    fontSize: moderateScale(13),
    color: "#64748B",
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },
  label: {
    fontSize: moderateScale(11.5),
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: verticalScale(14),
    marginBottom: verticalScale(4),
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#0F0A24",
    fontWeight: "600",
    marginTop: verticalScale(4),
  },
  inputMultiline: {
    height: verticalScale(80),
    textAlignVertical: "top",
  },
  rowFields: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginTop: verticalScale(6),
  },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "#EDE7FE",
  },
  chipText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#475569",
  },
  chipTextSelected: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: verticalScale(6),
  },
  counterLabel: {
    fontSize: moderateScale(12.5),
    color: "#64748B",
    fontWeight: "600",
    flex: 1,
    marginRight: scale(10),
  },
  counterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(14),
  },
  counterBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: moderateScale(10),
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#0F0A24",
  },
  counterVal: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F0A24",
    minWidth: scale(20),
    textAlign: "center",
  },
  submitBtn: {
    borderRadius: moderateScale(18),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(24),
    shadowColor: "#0F0A24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
