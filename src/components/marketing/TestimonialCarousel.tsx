"use client";

import type { PublicTestimonial } from "@/lib/data";

function QuoteCard({ item, hidden }: { item: PublicTestimonial; hidden?: boolean }) {
  return (
    <article
      aria-hidden={hidden || undefined}
      className={`quote-card mr-5 flex min-h-64 shrink-0 flex-col rounded-[28px] border border-[#D6A000]/25 bg-[#241018] p-6 text-left ${hidden ? "testimonial-clone" : ""}`}
    >
      <p className="text-[#D6A000]" aria-label={hidden ? undefined : `${item.rating} out of 5 stars`}>
        {"★".repeat(item.rating)}
        <span className="text-[#F6F1DC]/20">{"★".repeat(Math.max(0, 5 - item.rating))}</span>
      </p>
      <p className="mt-4 flex-1 text-sm leading-7 text-[#F6F1DC]/80">“{item.quote}”</p>
      <p className="mt-6 text-sm font-semibold">{item.name}</p>
      {item.route ? <p className="mt-1 text-xs tracking-[0.16em] text-[#F6F1DC]/50 uppercase">{item.route}</p> : null}
    </article>
  );
}

export function TestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) return null;

  return (
    <div className="quote-viewport overflow-hidden" aria-label="Customer comments">
      <div className="testimonial-track flex w-max">
        {items.map((item) => (
          <QuoteCard key={item.id} item={item} />
        ))}
        {items.map((item) => (
          <QuoteCard key={`${item.id}-clone`} item={item} hidden />
        ))}
      </div>
    </div>
  );
}
