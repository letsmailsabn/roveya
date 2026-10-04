import { HomePage } from "@/components/marketing/HomePage";
import { getPublishedTestimonials, getSettings, getTravelRoutes } from "@/lib/data";

export default async function Page() {
  const [routes, testimonials, settings] = await Promise.all([
    getTravelRoutes(),
    getPublishedTestimonials(),
    getSettings(),
  ]);
  return <HomePage routes={routes} testimonials={testimonials} settings={settings} />;
}
