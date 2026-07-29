import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK = {
  url: "/hero-deadlift.webp",
  alt: "Atlet i en dansk elitesportsklub under styrketræning med fokus på struktureret udvikling",
};

interface HeroImage {
  url: string;
  alt: string | null;
}

/**
 * Hero image / slideshow on the public landing page.
 * Images are managed in Admin → Forsidebilleder and stored as
 * pre-compressed WebP (max 1200px) so the LCP stays light.
 */
export function HeroSlideshow({ radius }: { radius: number }) {
  const [images, setImages] = useState<HeroImage[]>([FALLBACK]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("landing_hero_images" as any)
      .select("url, alt")
      .eq("active", true)
      .order("sort_order")
      .limit(5)
      .then(({ data }) => {
        if (cancelled) return;
        const list = ((data as unknown as HeroImage[]) ?? []).filter((i) => !!i.url);
        if (list.length) setImages(list);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: radius, overflow: "hidden" }}>
      {images.map((img, i) => (
        <img
          key={img.url}
          src={img.url}
          alt={img.alt || FALLBACK.alt}
          fetchPriority={i === 0 ? "high" : "low"}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
            opacity: i === index ? 1 : 0,
            transition: "opacity 900ms ease",
          }}
        />
      ))}

      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {images.map((img, i) => (
            <button
              key={img.url}
              aria-label={`Vis billede ${i + 1}`}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: i === index ? "#F5C842" : "rgba(255,255,255,0.45)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
