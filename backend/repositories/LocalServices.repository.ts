import { BaseRepository } from "./Base.repository";
import {
  ServiceProvider,
  LocalService,
} from "../entities/ServiceProvider.entity";
import { FindManyOptions } from "typeorm";

export interface ServiceProRecord {
  id: string;
  name: string;
  category: string;
  cluster: string;
  categoryIcon: string;
  rating: number;
  reviewsCount: number;
  experience: string;
  distance: string;
  rate: string;
  verified: boolean;
  avatarBg: string;
  phone: string;
  description?: string;
  availableToday: boolean;
  createdAt: string;
}

export class LocalServicesRepository extends BaseRepository<ServiceProvider> {
  // In-memory fallback store if database is running without PostgreSQL connection
  private fallbackStore: ServiceProvider[] = [
    // 🔧 Fix & Repair
    {
      id: "pro_suresh_elec",
      title: "Suresh Kumar",
      category: "Electrician",
      categoryIcon: "flash",
      rating: 4.9,
      reviewsCount: 38,
      experience: "6+ yrs exp",
      locationName: "0.8 km away",
      rate: "From ₹150 visit",
      verified: true,
      avatarBg: "#EA580C",
      phone: "+91 98480 12345",
      description:
        "Licensed master electrician for house wiring, MCB switchboard, geyser & inverter repairs.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_ramesh_plumb",
      title: "Ramesh Patel",
      category: "Plumber",
      categoryIcon: "water",
      rating: 4.8,
      reviewsCount: 29,
      experience: "5+ yrs exp",
      locationName: "1.2 km away",
      rate: "From ₹180 visit",
      verified: true,
      avatarBg: "#0284C7",
      phone: "+91 98480 54321",
      description:
        "Bathroom & kitchen leak repairs, pipeline blockage clearing, overhead tank & motor fitting.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_abdul_ac",
      title: "Abdul AC Cooling Clinic",
      category: "AC repair",
      categoryIcon: "snow",
      rating: 4.9,
      reviewsCount: 46,
      experience: "8+ yrs exp",
      locationName: "1.5 km away",
      rate: "From ₹299 visit",
      verified: true,
      avatarBg: "#059669",
      phone: "+91 98480 98765",
      description:
        "Split & window AC deep jet cleaning, gas charging, cooling coil repair & PCB troubleshooting.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_venkat_appl",
      title: "Venkat Appliance Care",
      category: "Washing machine repair",
      categoryIcon: "sync",
      rating: 4.85,
      reviewsCount: 34,
      experience: "7+ yrs exp",
      locationName: "1.6 km away",
      rate: "From ₹249 visit",
      verified: true,
      avatarBg: "#6366F1",
      phone: "+91 98480 34567",
      description:
        "Automatic front/top load washing machines, dryer drum, pump & motor board fixing.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_srinivas_carp",
      title: "Srinivas Wood Craft",
      category: "Carpenter",
      categoryIcon: "hammer",
      rating: 4.8,
      reviewsCount: 24,
      experience: "10+ yrs exp",
      locationName: "2.3 km away",
      rate: "From ₹250 visit",
      verified: true,
      avatarBg: "#D97706",
      phone: "+91 98480 23456",
      description:
        "Modular wardrobe repair, hydraulic hinges, custom shoe racks, door locks & furniture assembly.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_sai_tv",
      title: "Sri Sai Electronics & TV",
      category: "TV/electronics repair",
      categoryIcon: "tv",
      rating: 4.75,
      reviewsCount: 22,
      experience: "9+ yrs exp",
      locationName: "1.9 km away",
      rate: "From ₹200 visit",
      verified: true,
      avatarBg: "#8B5CF6",
      phone: "+91 98480 76543",
      description:
        "Smart 4K LED TV backlight, sound card, microwave oven & home electronics circuit repairs.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,

    // 💄 GlamUp ✨ (Beauty at your doorstep)
    {
      id: "pro_ananya_bridal",
      title: "Ananya Makeover Studio",
      category: "Bridal makeup",
      categoryIcon: "rose",
      rating: 4.95,
      reviewsCount: 62,
      experience: "6+ yrs exp",
      locationName: "1.1 km away",
      rate: "From ₹1,499 session",
      verified: true,
      avatarBg: "#EC4899",
      phone: "+91 98480 77112",
      description:
        "GlamUp ✨ Certified bridal makeup, HD engagement look, party makeup & doorstep saree draping.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_radhika_salon",
      title: "Radhika Doorstep Salon",
      category: "Facial",
      categoryIcon: "happy",
      rating: 4.9,
      reviewsCount: 48,
      experience: "5+ yrs exp",
      locationName: "0.9 km away",
      rate: "From ₹299 visit",
      verified: true,
      avatarBg: "#F472B6",
      phone: "+91 98480 88223",
      description:
        "GlamUp ✨ Hydra glow facial, herbal cleanup, waxing, eyebrow shaping & threading at home.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_pooja_mehendi",
      title: "Pooja Mehendi & Saree Arts",
      category: "Mehendi",
      categoryIcon: "flower",
      rating: 4.9,
      reviewsCount: 35,
      experience: "4+ yrs exp",
      locationName: "1.4 km away",
      rate: "From ₹350 design",
      verified: true,
      avatarBg: "#B45309",
      phone: "+91 98480 99334",
      description:
        "GlamUp ✨ Organic bridal mehendi, Arabic intricate patterns, stylish saree draping & nail art.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_sneha_hair",
      title: "GlamCuts by Sneha",
      category: "Hair styling",
      categoryIcon: "color-wand",
      rating: 4.8,
      reviewsCount: 29,
      experience: "4+ yrs exp",
      locationName: "1.7 km away",
      rate: "From ₹249 visit",
      verified: true,
      avatarBg: "#8B5CF6",
      phone: "+91 98480 66445",
      description:
        "GlamUp ✨ Doorstep hair styling, curls, party blowout, hair spa & brow threading.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ServiceProvider,
    {
      id: "pro_divya_nails",
      name: "Divya Nail Studio & Art",
      title: "Divya Nail Studio & Art",
      category: "Nails & Art",
      categoryIcon: "sparkles",
      rating: 4.85,
      reviewsCount: 26,
      experience: "3+ yrs exp",
      locationName: "2.1 km away",
      rate: "From ₹399 visit",
      verified: true,
      avatarBg: "#DB2777",
      phone: "+91 98480 44556",
      description:
        "GlamUp ✨ Gel nails, acrylic extensions, chrome art, french manicure & pedicure at home.",
      availableToday: true,
      cluster: "glam",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ServiceProvider,

    // 🧹 Home Help
    {
      id: "pro_shine_clean",
      title: "ShineBright Home Care",
      category: "Deep cleaning",
      categoryIcon: "shield-checkmark",
      rating: 4.9,
      reviewsCount: 53,
      experience: "4+ yrs exp",
      locationName: "1.8 km away",
      rate: "From ₹499 visit",
      verified: true,
      avatarBg: "#10B981",
      phone: "+91 98480 87654",
      description:
        "Deep kitchen & bathroom scrubbing, sofa shampooing, full home sanitization & floor buffing.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_lakshmi_cook",
      title: "Lakshmi Home Cook & Tiffin",
      category: "Cooking",
      categoryIcon: "restaurant",
      rating: 4.85,
      reviewsCount: 41,
      experience: "8+ yrs exp",
      locationName: "0.7 km away",
      rate: "From ₹300 / meal",
      verified: true,
      avatarBg: "#F59E0B",
      phone: "+91 98480 33221",
      description:
        "Healthy North & South Indian home meals, daily tiffin service, temporary cook for family dinners.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_safeshield_pest",
      title: "SafeShield Pest Solutions",
      category: "Pest-control requests",
      categoryIcon: "bug",
      rating: 4.9,
      reviewsCount: 39,
      experience: "6+ yrs exp",
      locationName: "2.1 km away",
      rate: "From ₹599 service",
      verified: true,
      avatarBg: "#DC2626",
      phone: "+91 98480 11998",
      description:
        "100% odorless herbal cockroach gel treatment, termite control & anti-mosquito fogging.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_swift_movers",
      title: "SwiftShift Packers & Helpers",
      category: "Moving assistance",
      categoryIcon: "cube",
      rating: 4.8,
      reviewsCount: 27,
      experience: "5+ yrs exp",
      locationName: "2.5 km away",
      rate: "From ₹799 service",
      verified: true,
      avatarBg: "#6366F1",
      phone: "+91 98480 44882",
      description:
        "Careful household packing, unpacking, heavy furniture loading & apartment shifting assistance.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,

    // 🚗 Auto Help
    {
      id: "pro_rajesh_mech",
      title: "Rajesh Auto Works",
      category: "Bike repair",
      categoryIcon: "bicycle",
      rating: 4.7,
      reviewsCount: 21,
      experience: "7+ yrs exp",
      locationName: "2.0 km away",
      rate: "From ₹199 visit",
      verified: true,
      avatarBg: "#9333EA",
      phone: "+91 98480 45678",
      description:
        "Doorstep bike servicing, engine oil change, brake calibration, spark plug & chain lubrication.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_quick_puncture",
      title: "QuickFix Puncture & Battery",
      category: "Puncture",
      categoryIcon: "disc",
      rating: 4.9,
      reviewsCount: 58,
      experience: "5+ yrs exp",
      locationName: "0.6 km away",
      rate: "From ₹120 on-spot",
      verified: true,
      avatarBg: "#EF4444",
      phone: "+91 98480 55771",
      description:
        "24x7 mobile tubeless puncture repair, battery jumpstart & emergency air fill at your doorstep.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_hydro_wash",
      title: "HydroShine Mobile Car Wash",
      category: "Car wash",
      categoryIcon: "water",
      rating: 4.85,
      reviewsCount: 44,
      experience: "4+ yrs exp",
      locationName: "1.3 km away",
      rate: "From ₹349 wash",
      verified: true,
      avatarBg: "#06B6D4",
      phone: "+91 98480 22663",
      description:
        "Eco-friendly doorstep foam wash, high-power interior vacuuming & tire gloss polish.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
    {
      id: "pro_roadside_speed",
      title: "SpeedTrack 24x7 Roadside Help",
      category: "Roadside assistance",
      categoryIcon: "warning",
      rating: 4.9,
      reviewsCount: 33,
      experience: "8+ yrs exp",
      locationName: "1.5 km away",
      rate: "From ₹299 assist",
      verified: true,
      avatarBg: "#2563EB",
      phone: "+91 98480 99881",
      description:
        "24/7 on-call towing, emergency fuel drop, battery boost & minor breakdown roadside assistance.",
      availableToday: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LocalService,
  ];

  constructor() {
    super(ServiceProvider);
  }

  /**
   * Helper to derive cluster from category if not explicitly provided
   */
  private deriveCluster(category?: string, description?: string): string {
    const text = `${category || ""} ${description || ""}`.toLowerCase();
    if (
      text.includes("makeup") ||
      text.includes("bridal") ||
      text.includes("mehendi") ||
      text.includes("hair") ||
      text.includes("facial") ||
      text.includes("waxing") ||
      text.includes("nail") ||
      text.includes("glam")
    ) {
      return "glam";
    }
    if (
      text.includes("bike") ||
      text.includes("puncture") ||
      text.includes("car") ||
      text.includes("auto") ||
      text.includes("roadside")
    ) {
      return "auto";
    }
    if (
      text.includes("clean") ||
      text.includes("cook") ||
      text.includes("maid") ||
      text.includes("pest") ||
      text.includes("moving") ||
      text.includes("packing")
    ) {
      return "home";
    }
    return "fix";
  }

  /**
   * Transforms a ServiceProvider DB entity into application ServiceProRecord
   */
  public toRecord(entity: ServiceProvider): ServiceProRecord {
    return {
      id: entity.id,
      name: entity.name || entity.title || "Service Expert",
      category: entity.category,
      cluster:
        entity.cluster ||
        this.deriveCluster(entity.category, entity.description),
      categoryIcon: entity.categoryIcon || "construct",
      rating: entity.rating ? Number(entity.rating) : 5.0,
      reviewsCount: entity.reviewsCount ? Number(entity.reviewsCount) : 1,
      experience: entity.experience || "3+ yrs exp",
      distance: entity.locationName || "Near you",
      rate:
        entity.rate ||
        (entity.price ? `From ₹${entity.price} visit` : "From ₹150 visit"),
      verified: entity.verified ?? true,
      avatarBg: entity.avatarBg || "#EA580C",
      phone: entity.phone || "",
      description: entity.description || "",
      availableToday: entity.availableToday ?? true,
      createdAt: entity.createdAt
        ? new Date(entity.createdAt).toISOString()
        : new Date().toISOString(),
    };
  }

  async countProviderServices(providerId: string): Promise<number> {
    if (!this.isConnected) {
      return this.fallbackStore.filter((s) => s.providerId === providerId)
        .length;
    }
    return this.repo.count({ where: { providerId } });
  }

  async findById(id: string): Promise<ServiceProvider | null> {
    if (!this.isConnected) {
      return this.fallbackStore.find((s) => s.id === id) || null;
    }
    return this.repo.findOne({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<ServiceProvider[]> {
    if (!this.isConnected) {
      return this.fallbackStore.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase(),
      );
    }
    return this.repo.find({
      where: { category },
      order: { createdAt: "DESC" },
    });
  }

  async findAllServices(
    options?: FindManyOptions<ServiceProvider>,
  ): Promise<ServiceProvider[]> {
    if (!this.isConnected) {
      return [...this.fallbackStore].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }
    return this.repo.find({
      ...options,
      order: options?.order || { createdAt: "DESC" },
    });
  }

  async createService(
    data: Partial<ServiceProvider>,
  ): Promise<ServiceProvider> {
    const cluster =
      data.cluster || this.deriveCluster(data.category, data.description);
    if (!this.isConnected) {
      const newEntity: ServiceProvider = {
        id:
          data.id ||
          `pro_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        providerId: data.providerId,
        provider: data.provider as any,
        name: data.name || data.title || "Service Expert",
        title: data.title || data.name || "Service Expert",
        cluster,
        category: data.category || "General",
        description: data.description || "",
        price: data.price,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        experience: data.experience,
        rate: data.rate,
        avatarBg: data.avatarBg,
        categoryIcon: data.categoryIcon,
        availableToday: data.availableToday ?? true,
        verified: data.verified ?? true,
        rating: data.rating ?? 5.0,
        reviewsCount: data.reviewsCount ?? 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.fallbackStore.unshift(newEntity);
      return newEntity;
    }

    const entity = this.repo.create({
      ...data,
      cluster,
      name: data.name || data.title || "Service Expert",
    } as any);
    return (await this.repo.save(entity as any)) as ServiceProvider;
  }
}

export const localServicesRepository = new LocalServicesRepository();
export const serviceProviderRepository = localServicesRepository;
export type ServiceProviderRepository = LocalServicesRepository;
