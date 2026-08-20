import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url:"https://ursewbro.com", changeFrequency:"weekly", priority:1 },{ url:"https://ursewbro.com/track", changeFrequency:"monthly", priority:.4 }]; }
