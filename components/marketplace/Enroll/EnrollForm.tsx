import React, { useState, useTransition } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CategorySelector } from "./CategorySelector";
import {
  EnrollFormData,
  EnrollFormErrors,
  MarketplaceCategory,
} from "../types";
import { pickAndUploadImage } from "@/services/cloudinaryService";

/**
 * Dynamic placeholder text for "Skills & Specialization" based on category
 */
export const getSkillsPlaceholderForCategory = (
  categoryName: string,
): string => {
  const cat = (categoryName || "").toLowerCase().trim();

  if (cat.includes("electric")) {
    return "e.g. Domestic wiring, MCB switchboard repairs, inverter setup, fan & light installation, short-circuit diagnostics...";
  }
  if (cat.includes("plumb")) {
    return "e.g. Pipe leakage fixes, bathroom fittings, tap & shower installation, water tank cleaning, motor pump repairs...";
  }
  if (cat.includes("carpenter")) {
    return "e.g. Furniture making & repair, door lock fitting, modular kitchen cabinets, wooden polishing, hinge adjustments...";
  }
  if (
    cat.includes("ac repair") ||
    cat.includes("ac cleaning") ||
    cat === "ac"
  ) {
    return "e.g. Split & window AC gas charging, cooling issue diagnostics, jet foam cleaning, compressor & PCB repair...";
  }
  if (cat.includes("washing machine")) {
    return "e.g. Front & top load drum repairs, motor replacement, PCB board repair, water drainage and spin cycle fixes...";
  }
  if (cat.includes("refrigerator") || cat.includes("fridge")) {
    return "e.g. Compressor replacement, thermostat fix, cooling coil repair, gas charging, single & double door servicing...";
  }
  if (cat.includes("tv") || cat.includes("electronic")) {
    return "e.g. LED/OLED screen replacements, mother-board soldering, audio system repairs, wall-mount installations...";
  }
  if (cat.includes("motor")) {
    return "e.g. Submersible pump rewinding, capacitor replacements, borewell motor servicing, industrial motor repairs...";
  }
  if (cat.includes("bike") || cat.includes("two wheeler")) {
    return "e.g. Engine tune-ups, disc brake servicing, clutch plate replacements, carburetor tuning, oil change & chain lube...";
  }
  if (cat.includes("car repair") || cat.includes("four wheeler")) {
    return "e.g. Engine diagnostics, brake pads overhaul, suspension repairs, clutch overhaul, battery jumpstart & OBD scans...";
  }
  if (cat.includes("puncture")) {
    return "e.g. Quick tubeless & tube tyre puncture repair, mushroom patch, air pressure top-up, emergency doorstep puncture fix...";
  }
  if (cat.includes("battery")) {
    return "e.g. Doorstep battery jumpstart, alternator check, terminal cleaning, emergency battery replacement & charging...";
  }
  if (cat.includes("car wash")) {
    return "e.g. Pressure foam wash, interior dry vacuuming, dashboard polishing, windshield treatment, paint wax coating...";
  }
  if (cat.includes("roadside")) {
    return "e.g. Emergency breakdown response, towing assistance, fuel delivery, flat tyre replacement, key lock-out assistance...";
  }
  if (cat.includes("deep clean") || cat.includes("cleaning")) {
    return "e.g. Kitchen deep degreasing, bathroom sanitization, floor scrubbing, sofa shampooing, balcony & window mesh cleaning...";
  }
  if (cat.includes("cook")) {
    return "e.g. North & South Indian home meals, dietary food, breakfast/lunch/dinner preparations, party catering assistance...";
  }
  if (cat.includes("maid") || cat.includes("housekeep")) {
    return "e.g. Utensil cleaning, daily floor mopping, cloth washing, dusting, basic domestic household assistance...";
  }
  if (cat.includes("pack") || cat.includes("moving")) {
    return "e.g. Bubble wrapping delicate glassware, furniture dismantling & reassembly, heavy carton loading & relocation...";
  }
  if (cat.includes("pest")) {
    return "e.g. Odorless cockroach herbal gel treatment, termite drill-and-fill, bed bug spray eradication, mosquito & rodent control...";
  }
  if (
    cat.includes("wax") ||
    cat.includes("facial") ||
    cat.includes("makeup") ||
    cat.includes("mehendi") ||
    cat.includes("nail") ||
    cat.includes("glam") ||
    cat.includes("beauty") ||
    cat.includes("saree")
  ) {
    return "e.g. Bridal & party makeup, herbal facial, rica waxing, custom bridal mehendi, gel nail art, hair spa & styling...";
  }

  return `e.g. Specialized in ${categoryName || "service repairs"}, diagnostic tools, equipment, and certified doorstep experience...`;
};

export const EXPERIENCE_OPTIONS = [
  { value: "1 yr exp", label: "1 Year Experience", badge: "1" },
  { value: "2 yrs exp", label: "2 Years Experience", badge: "2" },
  { value: "3 yrs exp", label: "3 Years Experience", badge: "3" },
  { value: "4 yrs exp", label: "4 Years Experience", badge: "4" },
  { value: "5 yrs exp", label: "5 Years Experience", badge: "5" },
  { value: "6 yrs exp", label: "6 Years Experience", badge: "6" },
  { value: "7 yrs exp", label: "7 Years Experience", badge: "7" },
  { value: "8 yrs exp", label: "8 Years Experience", badge: "8" },
  { value: "9 yrs exp", label: "9 Years Experience", badge: "9" },
  { value: "10 yrs exp", label: "10 Years Experience", badge: "10" },
  { value: "10+ yrs exp", label: "10+ Years Experience", badge: "10+" },
];

interface EnrollFormProps {
  categories: (MarketplaceCategory | string)[];
  initialData?: Partial<EnrollFormData>;
  onSubmit: (data: EnrollFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  accentColor?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  phoneLabel?: string;
  rateLabel?: string;
  ratePlaceholder?: string;
  experienceLabel?: string;
  experiencePlaceholder?: string;
  distancePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  submitButtonText?: string;
  isDark?: boolean;
}

/**
 * Native Browser Style Validation Callout Bubble
 * Mimics mobile Chrome / Safari HTML5 required field validation balloon
 */
const BrowserValidationCallout: React.FC<{
  message?: string;
}> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubbleArrow} />
      <View style={styles.bubbleBody}>
        <Ionicons name="alert-circle" size={14} color="#FCA5A5" />
        <Text style={styles.bubbleText}>{message}</Text>
      </View>
    </View>
  );
};

export const EnrollForm: React.FC<EnrollFormProps> = ({
  categories,
  initialData,
  onSubmit,
  isSubmitting = false,
  accentColor = "#EA580C",
  nameLabel = "Full Name / Business Name",
  namePlaceholder = "e.g. Ramesh Electricals & Appliances",
  phoneLabel = "Mobile Number",
  rateLabel = "Cost per Visit (₹)",
  ratePlaceholder = "150",
  experienceLabel = "Years of Experience",
  experiencePlaceholder = "Select Years of Experience",
  distancePlaceholder = "e.g. Within 5 km of Banjara Hills",
  descriptionLabel = "Skills & Specialization",
  descriptionPlaceholder,
  submitButtonText = "Submit Application",
  isDark = false,
}) => {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(
    initialData?.category ||
      (typeof categories[0] === "string"
        ? categories[0]
        : categories[0]?.name || ""),
  );
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [rate, setRate] = useState(initialData?.rate || "");
  const [experience, setExperience] = useState(
    initialData?.experience || "5 yrs exp",
  );
  const [distance, setDistance] = useState(initialData?.distance || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [availableDate, setAvailableDate] = useState<Date>(() => {
    if (initialData?.availableDate) {
      const parsed = new Date(initialData.availableDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const isSameDayAsToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Dynamic placeholder for Skills & Specialization based on the selected category
  const computedSkillsPlaceholder = getSkillsPlaceholderForCategory(category);
  const activeDescriptionPlaceholder =
    descriptionPlaceholder &&
    descriptionPlaceholder !==
      "Describe your expertise, tools, guarantee, and service turnaround..." &&
    descriptionPlaceholder !==
      "e.g. Specialized in domestic wiring, switchboard repairs, appliance troubleshooting..."
      ? descriptionPlaceholder
      : computedSkillsPlaceholder;
  const [avatar, setAvatar] = useState(initialData?.avatar || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);

  const handleUploadPhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const res = await pickAndUploadImage("services");
      if (res && res.url) {
        setAvatar(res.url);
        Alert.alert(
          "Photo Ready",
          "Provider photo uploaded to Cloudinary (services/)",
        );
      }
    } catch (err: any) {
      Alert.alert("Upload Notice", err?.message || "Could not upload image");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const [errors, setErrors] = useState<EnrollFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const bg = isDark ? "#1E293B" : "#FFFFFF";
  const border = isDark ? "#334155" : "#E2E8F0";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textMute = isDark ? "#94A3B8" : "#64748B";
  const inputBg = isDark ? "#0F172A" : "#F8FAFC";

  // Validate form fields with native browser-like messages
  const validate = (): boolean => {
    const newErrors: EnrollFormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Please fill out this field.";
    }

    // Category validation
    if (!category.trim()) {
      newErrors.category = "Please select a service category.";
    }

    // Phone validation (numeric only, exactly 10 digits)
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!phone.trim()) {
      newErrors.phone = "Please fill out this field.";
    } else if (cleanPhone.length < 10) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    // Rate validation (numeric only, > 0)
    const cleanRate = rate.replace(/[^0-9]/g, "");
    const numRate = Number(cleanRate);
    if (!cleanRate.trim()) {
      newErrors.rate = "Please fill out this field.";
    } else if (isNaN(numRate) || numRate <= 0) {
      newErrors.rate = "Please enter a valid visiting charge.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setTouched({
      name: true,
      category: true,
      phone: true,
      rate: true,
    });

    if (!validate()) {
      return;
    }

    const formData: EnrollFormData = {
      name: name.trim(),
      category: category.trim(),
      phone: phone.replace(/[^0-9]/g, ""),
      rate: rate.replace(/[^0-9]/g, ""),
      experience: experience.trim() || "5 yrs exp",
      distance: distance.trim() || "Near you",
      description: description.trim(),
      availableToday: isSameDayAsToday(availableDate),
      availableDate: availableDate.toISOString().split("T")[0],
      avatar: avatar.trim(),
    };

    await onSubmit(formData);
  };

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      {/* 1. Name Field */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {nameLabel} <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              color: textPrimary,
              borderColor: errors.name ? "#DC2626" : border,
            },
            errors.name && styles.errorInput,
          ]}
          placeholder={namePlaceholder}
          placeholderTextColor={textMute}
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, name: true }));
            if (!name.trim()) {
              setErrors((prev) => ({
                ...prev,
                name: "Please fill out this field.",
              }));
            }
          }}
        />
        <BrowserValidationCallout message={errors.name} />
      </View>

      {/* 2. Category Selector */}
      <CategorySelector
        categories={categories}
        selectedCategory={category}
        onSelectCategory={(cat) => {
          startTransition(() => {
            setCategory(cat);
            if (errors.category) {
              setErrors((prev) => ({ ...prev, category: undefined }));
            }
          });
        }}
        errorMessage={errors.category}
        accentColor={accentColor}
        isDark={isDark}
      />

      {/* 3. Mobile Number Field (Numeric Only) */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {phoneLabel} <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              color: textPrimary,
              borderColor: errors.phone ? "#DC2626" : border,
            },
            errors.phone && styles.errorInput,
          ]}
          placeholder="e.g. 9848012345 (10 digits)"
          placeholderTextColor={textMute}
          value={phone}
          onChangeText={(val) => {
            // Strictly numeric only
            const numericVal = val.replace(/[^0-9]/g, "");
            if (numericVal.length <= 10) {
              setPhone(numericVal);
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }
          }}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, phone: true }));
            const clean = phone.replace(/[^0-9]/g, "");
            if (!phone.trim()) {
              setErrors((prev) => ({
                ...prev,
                phone: "Please fill out this field.",
              }));
            } else if (clean.length < 10) {
              setErrors((prev) => ({
                ...prev,
                phone: "Please enter a valid 10-digit mobile number.",
              }));
            }
          }}
          keyboardType="phone-pad"
          inputMode="numeric"
          maxLength={10}
        />
        <BrowserValidationCallout message={errors.phone} />
      </View>

      {/* 4. Two Column Row: Experience (Modal Popup) & Visiting Rate (Numeric Only) */}
      <View style={styles.twoCol}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {experienceLabel}
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownTrigger,
              {
                backgroundColor: inputBg,
                borderColor: border,
              },
            ]}
            onPress={() => setIsExperienceModalOpen(true)}
            activeOpacity={0.75}
          >
            <View style={styles.dropdownInner}>
              <Ionicons name="time-outline" size={16} color={accentColor} />
              <Text
                style={[styles.dropdownValueText, { color: textPrimary }]}
                numberOfLines={1}
              >
                {experience || "5 yrs exp"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={textMute} />
          </TouchableOpacity>
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {rateLabel} <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={styles.rateInputWrap}>
            <View style={styles.currencyPrefix}>
              <Text style={[styles.currencyPrefixText, { color: textPrimary }]}>
                ₹
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.rateInput,
                {
                  backgroundColor: inputBg,
                  color: textPrimary,
                  borderColor: errors.rate ? "#DC2626" : border,
                },
                errors.rate && styles.errorInput,
              ]}
              placeholder={ratePlaceholder}
              placeholderTextColor={textMute}
              value={rate}
              onChangeText={(val) => {
                // Strictly numeric only
                const numericVal = val.replace(/[^0-9]/g, "");
                setRate(numericVal);
                if (errors.rate) {
                  setErrors((prev) => ({ ...prev, rate: undefined }));
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, rate: true }));
                const clean = rate.replace(/[^0-9]/g, "");
                const num = Number(clean);
                if (!clean.trim()) {
                  setErrors((prev) => ({
                    ...prev,
                    rate: "Please fill out this field.",
                  }));
                } else if (isNaN(num) || num <= 0) {
                  setErrors((prev) => ({
                    ...prev,
                    rate: "Please enter a valid visiting charge.",
                  }));
                }
              }}
              keyboardType="numeric"
              inputMode="numeric"
            />
          </View>
          <BrowserValidationCallout message={errors.rate} />
        </View>
      </View>

      {/* 5. Coverage Area */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: textPrimary }]}>
          Coverage Area
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              color: textPrimary,
              borderColor: border,
            },
          ]}
          placeholder={distancePlaceholder}
          placeholderTextColor={textMute}
          value={distance}
          onChangeText={setDistance}
        />
      </View>

      {/* 6. Skills & Specialization Description */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {descriptionLabel}
          </Text>
          {category ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: accentColor,
              }}
            >
              Category: {category}
            </Text>
          ) : null}
        </View>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: inputBg,
              color: textPrimary,
              borderColor: border,
            },
          ]}
          placeholder={activeDescriptionPlaceholder}
          placeholderTextColor={textMute}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* 7. Service Availability Date (Replaces Available Today with Calendar, minDate as today) */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Availability Date <Text style={styles.requiredStar}>*</Text>
          </Text>
        </View>
        <Text style={[styles.helperSubText, { color: textMute }]}>
          Select date when you are available to accept service bookings (min
          date is today)
        </Text>

        <TouchableOpacity
          style={[
            styles.calendarSelectorCard,
            {
              backgroundColor: inputBg,
              borderColor: showCalendar ? accentColor : border,
            },
          ]}
          onPress={() => setShowCalendar((prev) => !prev)}
          activeOpacity={0.8}
        >
          <View style={styles.calendarSelectorLeft}>
            <View
              style={[
                styles.calendarIconCircle,
                { backgroundColor: `${accentColor}18` },
              ]}
            >
              <Ionicons name="calendar" size={18} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.calendarSelectedDateText,
                  { color: textPrimary },
                ]}
              >
                {availableDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Text
                style={[
                  styles.calendarStatusHint,
                  {
                    color: isSameDayAsToday(availableDate)
                      ? "#10B981"
                      : accentColor,
                  },
                ]}
              >
                {isSameDayAsToday(availableDate)
                  ? "✓ Available today for immediate bookings"
                  : `📅 Available starting ${availableDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.calendarToggleActionBadge,
              {
                backgroundColor: showCalendar
                  ? accentColor
                  : isDark
                    ? "#334155"
                    : "#F1F5F9",
              },
            ]}
          >
            <Text
              style={[
                styles.calendarToggleActionText,
                { color: showCalendar ? "#FFFFFF" : textPrimary },
              ]}
            >
              {showCalendar ? "Done" : "Change Date"}
            </Text>
          </View>
        </TouchableOpacity>

        {(showCalendar || Platform.OS === "web") && (
          <View
            style={[
              styles.calendarPickerContainer,
              {
                backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                borderColor: border,
              },
            ]}
          >
            <DateTimePicker
              value={availableDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event: DateTimePickerEvent, date?: Date) => {
                if (Platform.OS !== "web") {
                  setShowCalendar(false);
                }
                if (date) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const chosen = new Date(date);
                  chosen.setHours(0, 0, 0, 0);
                  if (chosen < today) {
                    setAvailableDate(new Date());
                  } else {
                    setAvailableDate(date);
                  }
                }
              }}
              themeVariant={isDark ? "dark" : "light"}
            />
          </View>
        )}
      </View>

      {/* 8. Provider / Technician Photo (Cloudinary services/ folder) */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Profile / Workshop Photo{" "}
            <Text style={{ fontSize: 11, fontWeight: "500", color: textMute }}>
              (Cloudinary services/)
            </Text>
          </Text>
        </View>

        {avatar ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            }}
          >
            <Image
              source={{ uri: avatar }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 10,
                backgroundColor: "#E2E8F0",
              }}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "700",
                  color: textPrimary,
                }}
              >
                Photo uploaded
              </Text>
              <Text style={{ fontSize: 11, color: textMute }} numberOfLines={1}>
                {avatar}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAvatar("")}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.12)",
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: border,
              borderStyle: "dashed",
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            }}
            onPress={handleUploadPhoto}
            disabled={isUploadingPhoto}
            activeOpacity={0.8}
          >
            {isUploadingPhoto ? (
              <>
                <ActivityIndicator size="small" color={accentColor} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: textPrimary,
                  }}
                >
                  Uploading to Cloudinary...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={accentColor}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: textPrimary,
                  }}
                >
                  Upload Technician Photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 9. Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: accentColor },
          isSubmitting && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.btnContent}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>{submitButtonText}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Experience Selection Modal Popup */}
      <Modal
        visible={isExperienceModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsExperienceModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsExperienceModalOpen(false)}
        >
          <View
            style={[
              styles.dropdownPickerCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: border,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.dropdownPickerHeader}>
              <View style={styles.dropdownPickerHeaderLeft}>
                <View
                  style={[
                    styles.dropdownPickerIconWrap,
                    { backgroundColor: `${accentColor}20` },
                  ]}
                >
                  <Ionicons name="time" size={18} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.dropdownPickerTitle, { color: textPrimary }]}
                  >
                    Years of Experience
                  </Text>
                  <Text style={[styles.dropdownPickerSub, { color: textMute }]}>
                    Select 1 to 10+ years
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsExperienceModalOpen(false)}
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? "#334155" : "#F1F5F9" },
                ]}
              >
                <Ionicons name="close" size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
            >
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = (experience || "5 yrs exp") === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dropdownOptionRow,
                      {
                        backgroundColor: isSelected
                          ? `${accentColor}18`
                          : "transparent",
                        borderColor: isSelected ? accentColor : "transparent",
                      },
                    ]}
                    onPress={() => {
                      startTransition(() => {
                        setExperience(opt.value);
                        setIsExperienceModalOpen(false);
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownOptionLeft}>
                      <View
                        style={[
                          styles.dropdownOptionBadge,
                          {
                            backgroundColor: isSelected
                              ? accentColor
                              : isDark
                                ? "#334155"
                                : "#E2E8F0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionBadgeText,
                            { color: isSelected ? "#FFFFFF" : textPrimary },
                          ]}
                        >
                          {opt.badge}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          {
                            color: isSelected ? accentColor : textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={accentColor}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#DC2626",
    fontWeight: "700",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rateInputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  currencyPrefix: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  currencyPrefixText: {
    fontSize: 14,
    fontWeight: "700",
  },
  rateInput: {
    paddingLeft: 28,
  },
  errorInput: {
    borderColor: "#DC2626",
    backgroundColor: "rgba(220, 38, 38, 0.04)",
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  helperSubText: {
    fontSize: 12,
    marginBottom: 8,
  },
  calendarSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  calendarSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarSelectedDateText: {
    fontSize: 14,
    fontWeight: "700",
  },
  calendarStatusHint: {
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 2,
  },
  calendarToggleActionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  calendarToggleActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  calendarPickerContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 10,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Browser validation balloon / callout styles
  bubbleWrapper: {
    marginTop: 4,
    paddingLeft: 6,
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#1E293B",
    marginLeft: 12,
  },
  bubbleBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DC2626",
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Modal Picker Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownPickerCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.15)",
  },
  dropdownPickerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dropdownPickerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  dropdownPickerSub: {
    fontSize: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 3,
    borderWidth: 1,
  },
  dropdownOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dropdownOptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dropdownOptionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dropdownOptionText: {
    fontSize: 14,
  },
});
