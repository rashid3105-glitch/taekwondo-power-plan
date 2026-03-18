import watermark from "@/assets/watermark.png";

export const Watermark = () => (
  <div
    className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]"
    aria-hidden="true"
    style={{
      backgroundImage: `url(${watermark})`,
      backgroundRepeat: "repeat",
      backgroundSize: "280px auto",
      backgroundPosition: "center",
    }}
  />
);
