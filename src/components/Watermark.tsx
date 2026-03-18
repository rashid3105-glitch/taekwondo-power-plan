import watermark from "@/assets/watermark.png";

export const Watermark = () => (
  <div
    className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] flex items-center justify-center"
    aria-hidden="true"
  >
    <img
      src={watermark}
      alt=""
      className="w-[500px] h-auto max-w-[80vw] select-none"
      draggable={false}
    />
  </div>
);
