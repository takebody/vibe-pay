export interface LgeProduct {
  id: string;
  name: string;
  modelCode: string;
  category: "가전" | "TV/AV" | "IT/모니터" | "에어케어";
  originalPrice: number;
  discountRate: number;
  salePrice: number;
  benefitPrice?: number;
  imageUrl?: string;
  badges?: string[];
  deliveryNotice?: string;
  isPopular?: boolean;
}

export const LGE_CATALOG_PRODUCTS: LgeProduct[] = [
  {
    id: "75QNED65BBA",
    name: "LG QNED AI (벽걸이형)",
    modelCode: "75QNED65BBA",
    category: "TV/AV",
    originalPrice: 2710000,
    discountRate: 38,
    salePrice: 1680000,
    imageUrl: "/products/tv-qned.png",
    badges: ["189cm", "AI 화질"],
    deliveryNotice: "설치비 안내",
    isPopular: true,
  },
  {
    id: "T876MEE1H1",
    name: "LG 디오스 AI 오브제컬렉션 냉장고 (매직스페이스)",
    modelCode: "T876MEE1H1",
    category: "가전",
    originalPrice: 3088000,
    discountRate: 21,
    salePrice: 2440000,
    benefitPrice: 2042300,
    imageUrl: "/products/refrigerator-dios.png",
    badges: ["870L", "1등급"],
    deliveryNotice: "9/30(수)~11/27(금) 중 배송일 지정 가능",
    isPopular: true,
  },
  {
    id: "FX24KNTR",
    name: "LG 트롬 오브제컬렉션 세탁기",
    modelCode: "FX24KNTR",
    category: "가전",
    originalPrice: 1847000,
    discountRate: 28,
    salePrice: 1330000,
    benefitPrice: 1113300,
    imageUrl: "/products/washer-tromm.png",
    badges: ["24kg", "1등급"],
    deliveryNotice: "9/30(수)~11/27(금) 중 배송일 지정 가능",
    isPopular: true,
  },
  {
    id: "32G620B",
    name: "LG 울트라기어 게이밍모니터",
    modelCode: "32G620B",
    category: "IT/모니터",
    originalPrice: 448000,
    discountRate: 20,
    salePrice: 359000,
    benefitPrice: 339000,
    imageUrl: "/products/monitor-ultragear.png",
    badges: ["G6", "QHD"],
    deliveryNotice: "10/24(토)~11/27(금) 중 배송일 지정 가능",
    isPopular: true,
  },
  {
    id: "AS305DWWL",
    name: "LG 퓨리케어 AI 360° 공기청정기 플러스",
    modelCode: "AS305DWWL",
    category: "에어케어",
    originalPrice: 1452000,
    discountRate: 45,
    salePrice: 799000,
    benefitPrice: 715200,
    imageUrl: "/products/purifier-puricare.png",
    badges: ["BEST 1위", "100㎡", "2등급"],
    deliveryNotice: "10/3(토)~11/27(금) 중 배송일 지정 가능",
    isPopular: true,
  },
];
