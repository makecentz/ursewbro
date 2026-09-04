import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = "https://vivlox.store";
  return [
    { url:origin, changeFrequency:"weekly", priority:1 },
    { url:`${origin}/collections`, changeFrequency:"daily", priority:.9 },
    { url:`${origin}/privacy`, changeFrequency:"yearly", priority:.3 },
    { url:`${origin}/terms`, changeFrequency:"yearly", priority:.3 },
  ];
}
