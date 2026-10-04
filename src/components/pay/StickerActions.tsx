"use client";

export function StickerActions({ downloadHref = "/api/vehicle-qr" }: { downloadHref?: string }) {
  return (
    <div className="no-print mb-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-[#D6A000] px-6 py-3 text-sm font-semibold tracking-wide text-[#12060D]"
      >
        Print this card
      </button>
      <a href={downloadHref} className="rounded-full border border-[#D6A000]/50 px-6 py-3 text-sm text-[#F6F1DC]">
        Download PNG
      </a>
    </div>
  );
}
