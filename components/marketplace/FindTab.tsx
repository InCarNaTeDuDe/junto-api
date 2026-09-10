import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SearchBar } from "./Find/SearchBar";
import { CategoryList } from "./Find/CategoryList";
import { FilterBar } from "./Find/FilterBar";
import { ProviderCard } from "./Find/ProviderCard";
import { EmptyState } from "./Find/EmptyState";
import { MarketplaceCategory, MarketplaceProvider } from "./types";
import { Ionicons } from "@expo/vector-icons";

interface FindTabProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  categories: MarketplaceCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  verifiedOnly: boolean;
  onToggleVerified: () => void;
  providers: MarketplaceProvider[];
  isLoading?: boolean;
  loadingMessage?: string;
  onSelectProvider: (provider: MarketplaceProvider) => void;
  onResetFilters: () => void;
  accentColor?: string;
  actionButtonText?: string;
  actionButtonIcon?: keyof typeof Ionicons.glyphMap;
  isDark?: boolean;
  isListening?: boolean;
  onVoicePress?: () => void;
  itemNoun?: string;
  emptyEmoji?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const FindTab: React.FC<FindTabProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  categories,
  selectedCategory,
  onSelectCategory,
  verifiedOnly,
  onToggleVerified,
  providers,
  isLoading = false,
  loadingMessage = "Finding verified professionals...",
  onSelectProvider,
  onResetFilters,
  accentColor = "#EA580C",
  actionButtonText = "Book Doorstep",
  actionButtonIcon = "calendar-outline",
  isDark = false,
  isListening = false,
  onVoicePress,
  itemNoun = "specialists",
  emptyEmoji = "🔍",
  emptyTitle = "No specialists found",
  emptySubtitle = "Try adjusting your search query or selecting a different category.",
  headerContent,
  footerContent,
}) => {
  const textMute = isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        isDark={isDark}
        accentColor={accentColor}
        isListening={isListening}
        onVoicePress={onVoicePress}
      />

      {/* Category List */}
      <CategoryList
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        accentColor={accentColor}
        isDark={isDark}
      />

      {/* Optional Extra Header (e.g. Needs Broadcast or cluster chips) */}
      {headerContent}

      {/* Filter Bar */}
      <FilterBar
        totalCount={providers.length}
        verifiedOnly={verifiedOnly}
        onToggleVerified={onToggleVerified}
        accentColor={accentColor}
        isDark={isDark}
        itemNoun={itemNoun}
      />

      {/* Main List Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: textMute }]}>
            {loadingMessage}
          </Text>
        </View>
      ) : providers.length === 0 ? (
        <EmptyState
          emoji={emptyEmoji}
          title={emptyTitle}
          subtitle={emptySubtitle}
          actionText="View All Specialists"
          onAction={onResetFilters}
          accentColor={accentColor}
          isDark={isDark}
        />
      ) : (
        <View style={styles.listContainer}>
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onSelect={onSelectProvider}
              accentColor={accentColor}
              actionButtonText={actionButtonText}
              actionButtonIcon={actionButtonIcon}
              isDark={isDark}
            />
          ))}
        </View>
      )}

      {/* Optional Footer Content */}
      {footerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
});
