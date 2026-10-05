import { Calculator } from "@/components/Calculator";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description: "Homelab power consumption and electricity cost calculator with upgrade payback.",
  offers: { "@type": "Offer", price: "0" },
};

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">{TAGLINE}</h1>
        <p className="mt-1 text-muted">Add your kit to see what it costs to run each year, and whether an upgrade would pay for itself.</p>
      </div>
      <Calculator />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
