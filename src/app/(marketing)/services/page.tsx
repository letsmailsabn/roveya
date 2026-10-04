import type { Metadata } from "next";
import { AnalyticsPing } from "@/components/analytics/track";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Point-to-point, long-distance and route-based travel with digital ride payments from ROVEYA.",
};

export default function ServicesPage() {
  return (
    <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <AnalyticsPing event="services_viewed" />
      <p className="kicker">Services</p>
      <h1 className="display mt-3 text-5xl md:text-6xl">Our services</h1>
      <p className="mt-5 max-w-2xl text-[#F6F1DC]/70">
        ROVEYA is built for passengers who are already travelling. Each service is designed around comfort, clarity and a payment process that takes seconds.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {SERVICES.map((s) => (
          <article key={s.title} className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-8">
            <s.Icon className="h-9 w-9 text-[#D6A000]" />
            <h2 className="mt-5 text-2xl font-semibold">{s.title}</h2>
            <p className="mt-3 leading-7 text-[#F6F1DC]/68">{s.copy}</p>
          </article>
        ))}
      </div>
    </article>
  );
}
