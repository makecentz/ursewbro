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
  { id: "question-mark-denim", name: "Question Mark Denim", category: "Custom Jeans", price: 185, badge: "NEW", tone: "blue", art: "?", sizes: ["30", "32", "34", "36"], description: "Hand-cut patchwork denim with the signature UrSewBro question-mark treatment." },
  { id: "after-hours-flare", name: "After Hours Flare", category: "One-of-One", price: 240, badge: "1 OF 1", tone: "black", art: "✦", sizes: ["34"], description: "Reconstructed black denim, widened by hand and finished with exposed seam work." },
  { id: "studio-work-jacket", name: "Studio Work Jacket", category: "Jackets", price: 165, badge: "LOW STOCK", tone: "cream", art: "USB", sizes: ["M", "L", "XL"], description: "Heavyweight studio jacket with raw-edge labels and reinforced utility pockets." },
  { id: "threadline-hoodie", name: "Threadline Hoodie", category: "Hoodies", price: 98, tone: "green", art: "//", sizes: ["S", "M", "L", "XL"], description: "Premium cotton hoodie with contrast thread graphics and hand-finished details." },
];

export const customPackages = [
  { id: "package-1", no: "01", name: "Disoriented Regular", subtitle: "Patchwork customization", price: 125, details: ["Signature question-mark patchwork", "Placement consultation", "Return shipping"] },
  { id: "package-2", no: "02", name: "Disoriented Flares", subtitle: "Patchwork + flare conversion", price: 195, details: ["Everything in Package 1", "Flare conversion", "Optional cuts & distressing"] },
  { id: "package-3", no: "03", name: "Flare + Dye", subtitle: "The full transformation", price: 265, details: ["Everything in Packages 1 + 2", "Custom color dye", "Full finish consultation"] },
];

export const faqs = [
  ["How does the custom jeans service work?", "Choose a package, tell us what you want, upload references, and check out. We send shipping instructions so your jeans can make their way to the sewing room."],
  ["Do I send my own jeans?", "Yes for the preset custom packages. Your jeans become the canvas. If you need us to source a garment, use the custom quote form."],
  ["How long does customization take?", "Most package work takes about 3–4 days after the garment arrives. Shipping time and complex projects can add time."],
  ["Can you copy another designer's exact design?", "No. Inspiration helps communicate your idea, but every UrSewBro piece stays original and may vary with the garment and materials."],
  ["Do you offer refunds on custom work?", "Because custom work is made for one person, completed customization is generally final sale. We confirm the direction before work begins."],
  ["How do One-of-One pieces work?", "There is exactly one. Once it sells, it moves to the sold archive and cannot be purchased again."],
];
