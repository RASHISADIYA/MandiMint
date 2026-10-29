export interface CropInfo {
  id: bigint;
  name: string;
  hindiName: string;
  category: "Cereal" | "Pulse" | "Oilseed" | "Fiber" | "Vegetable" | "Commercial";
  defaultPriceInrPerTonne: bigint;
  emoji: string;
  description: string;
}

export const CROPS_CATALOG: CropInfo[] = [
  {
    id: 1n,
    name: "Sharbati Wheat",
    hindiName: "गेहूं (शरबती)",
    category: "Cereal",
    defaultPriceInrPerTonne: 28500n,
    emoji: "🌾",
    description: "Premium high-protein wheat commonly traded in MP & Punjab mandis.",
  },
  {
    id: 2n,
    name: "Basmati Paddy (1121)",
    hindiName: "बासमती धान (1121)",
    category: "Cereal",
    defaultPriceInrPerTonne: 42000n,
    emoji: "🍚",
    description: "Export-grade aromatic long-grain paddy traded across North India.",
  },
  {
    id: 3n,
    name: "Yellow Soybean (JS-9560)",
    hindiName: "सोयाबीन (JS-9560)",
    category: "Oilseed",
    defaultPriceInrPerTonne: 48000n,
    emoji: "🌱",
    description: "Key kharif oilseed traded heavily in Malwa & Maharashtra mandis.",
  },
  {
    id: 4n,
    name: "Medium Staple Cotton",
    hindiName: "कपास (शंकर-6)",
    category: "Fiber",
    defaultPriceInrPerTonne: 68000n,
    emoji: "☁️",
    description: "White gold cash crop traded in Gujarat, Telangana & Maharashtra.",
  },
  {
    id: 5n,
    name: "Black Mustard Bold",
    hindiName: "सरसों (काली बोल्ड)",
    category: "Oilseed",
    defaultPriceInrPerTonne: 56500n,
    emoji: "🌼",
    description: "High oil-content rabi crop traded across Rajasthan and Haryana mandis.",
  },
  {
    id: 6n,
    name: "Desi Chickpea / Chana",
    hindiName: "देसी चना",
    category: "Pulse",
    defaultPriceInrPerTonne: 58000n,
    emoji: "🧆",
    description: "Essential protein pulse widely tracked under agricultural MSP mandates.",
  },
  {
    id: 7n,
    name: "Hybrid Yellow Maize",
    hindiName: "मक्का (पीला)",
    category: "Cereal",
    defaultPriceInrPerTonne: 22000n,
    emoji: "🌽",
    description: "Coarse grain traded for poultry feed and starch processing.",
  },
  {
    id: 8n,
    name: "Kufri Jyoti Potato",
    hindiName: "आलू (कुफरी ज्योति)",
    category: "Vegetable",
    defaultPriceInrPerTonne: 14000n,
    emoji: "🥔",
    description: "High-volume perishable tuber recorded during winter harvest arrivals.",
  },
  {
    id: 9n,
    name: "Nashik Red Onion",
    hindiName: "लाल प्याज़ (नासिक)",
    category: "Vegetable",
    defaultPriceInrPerTonne: 18000n,
    emoji: "🧅",
    description: "Key market vegetable traded across Lasalgaon and Pimpalgaon mandis.",
  },
  {
    id: 10n,
    name: "Bold Groundnut / Peanut",
    hindiName: "मूंगफली (बोल्ड)",
    category: "Oilseed",
    defaultPriceInrPerTonne: 63000n,
    emoji: "🥜",
    description: "Major oilseed crop with strict sorting and moisture requirements.",
  },
];

export function getCropById(id: bigint | number | string): CropInfo {
  const numericId = typeof id === "bigint" ? id : BigInt(id);
  const found = CROPS_CATALOG.find((crop) => crop.id === numericId);
  if (found) {
    return found;
  }
  return {
    id: numericId,
    name: `Crop #${numericId.toString()}`,
    hindiName: `फसल कोड #${numericId.toString()}`,
    category: "Commercial",
    defaultPriceInrPerTonne: 25000n,
    emoji: "🌾",
    description: "Registered agricultural commodity batch.",
  };
}

export function getAllCrops(): CropInfo[] {
  return CROPS_CATALOG;
}
