import { Ionicons } from "@expo/vector-icons";

export interface MarketplaceProvider {
  id: string;
  name: string;
  category: string;
  cluster?: string;
  categoryIcon?: keyof typeof Ionicons.glyphMap | string;
  rating: number;
  reviewsCount: number;
  experience?: string;
  distance?: string;
  rate?: string;
  price?: number;
  verified?: boolean;
  avatarBg?: string;
  phone?: string;
  description?: string;
  availableToday?: boolean;
  availableDate?: string;
  portfolioImages?: string[];
  badges?: string[];
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: keyof typeof Ionicons.glyphMap | string;
  emoji?: string;
  color?: string;
  cluster?: string;
}

export interface MarketplaceThemeConfig {
  accentColor: string;
  accentLight: string;
  badgeBg: string;
  badgeText: string;
  brandTitle: string;
  brandTagline: string;
  findTabLabel: string;
  enrollTabLabel: string;
  enrollHeroIcon: string;
  enrollHeroTitle: string;
  enrollHeroSubtitle: string;
  rateUnitLabel: string;
  ratePlaceholder: string;
  descriptionPlaceholder: string;
  categorySelectorTitle: string;
}

export interface EnrollFormData {
  name: string;
  category: string;
  cluster?: string;
  phone: string;
  experience: string;
  rate: string;
  distance: string;
  description: string;
  availableToday?: boolean;
  availableDate?: string;
  avatar?: string;
  portfolioImages?: string[];
}

export interface EnrollFormErrors {
  name?: string;
  phone?: string;
  category?: string;
  rate?: string;
  distance?: string;
  description?: string;
}
