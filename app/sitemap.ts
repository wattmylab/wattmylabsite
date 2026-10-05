import type { MetadataRoute } from "next";
import { devices } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/devices`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...devices.map((d) => ({ url: `${SITE_URL}/devices/${d.slug}`, lastModified: d.lastReviewed, priority: 0.7 })),
  ];
}
