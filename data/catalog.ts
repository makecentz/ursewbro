export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  badge?: string;
  tone: string;
  art: string;
  sizes: string[];
  description: string;
};

export const products: Product[] = [
  { id: "question-mark-denim", name: "Question Mark Denim", category: "Denim", price: 185, badge: "NEW", tone: "blue", art: "?", sizes: ["30", "32", "34", "36"], description: "Ready-to-wear patchwork denim with the signature Vivlox question-mark treatment." },
  { id: "after-hours-flare", name: "After Hours Flare", category: "Limited Release", price: 240, badge: "LIMITED", tone: "black", art: "✦", sizes: ["34"], description: "Ready-to-wear black denim with a flared silhouette and exposed seam details." },
  { id: "studio-work-jacket", name: "Studio Work Jacket", category: "Jackets", price: 165, badge: "LOW STOCK", tone: "cream", art: "VXL", sizes: ["M", "L", "XL"], description: "Heavyweight studio jacket with raw-edge labels and reinforced utility pockets." },
  { id: "threadline-hoodie", name: "Threadline Hoodie", category: "Hoodies", price: 98, tone: "green", art: "//", sizes: ["S", "M", "L", "XL"], description: "Premium cotton hoodie with contrast thread graphics and hand-finished details." },
];

export const faqs = [
  ["Are all Vivlox pieces ready to wear?", "Yes. Every item listed in the shop is already designed and produced, so you can choose your size and check out immediately while stock lasts."],
  ["When will my order ship?", "In-stock orders are prepared after checkout. You’ll receive tracking as soon as your package is on the way."],
  ["Will sold-out pieces return?", "Some limited runs may not return. Join drop alerts for upcoming releases and restocks."],
  ["How should I choose my size?", "Use the available sizes shown on each product. For the best fit, compare the garment measurements with a piece you already own."],
  ["What is your return policy?", "Eligible unworn pieces can be returned according to the store return window. Final-sale items are marked before checkout."],
  ["How do limited releases work?", "Limited releases are produced in smaller quantities and remain available only while stock lasts."],
];
