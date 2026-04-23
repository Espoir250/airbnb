export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: "apartment" | "house" | "villa" | "cabin";
  amenities: string[];
  rating?: number;
  host: string;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Modern City Apartment",
    description: "Bright apartment close to shops, cafes, and public transport.",
    location: "Kigali, Rwanda",
    pricePerNight: 85,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Kitchen", "Washer"],
    rating: 4.7,
    host: "Amina Uwase"
  },
  {
    id: 2,
    title: "Lakeview Cabin Retreat",
    description: "Peaceful cabin with beautiful sunrise views and outdoor seating.",
    location: "kigali, Rwanda",
    pricePerNight: 120,
    guests: 4,
    type: "cabin",
    amenities: ["Parking", "Fireplace", "Hot Water"],
    rating: 4.9,
    host: "Grace Uwimana"
  },
  {
    id: 3,
    title: "Family Villa Escape",
    description: "Spacious villa perfect for family trips and longer stays.",
    location: "Kigali, Rwanda",
    pricePerNight: 250,
    guests: 8,
    type: "villa",
    amenities: ["Pool", "WiFi", "Air Conditioning"],
    host: "Grace Uwimana"
  }
];
