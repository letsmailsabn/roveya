import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the ROVEYA travel desk by phone, WhatsApp or email.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <article className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8">
      <div>
        <p className="kicker">Contact</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">Contact us</h1>
        <p className="mt-5 max-w-md text-[#F6F1DC]/70">
          For service questions, group travel or operational assistance, reach the ROVEYA desk during business hours.
        </p>
        <ul className="mt-8 space-y-4 text-sm">
          <li>
            Phone:{" "}
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="font-medium text-[#D6A000]">
              {settings.phone}
            </a>
          </li>
          <li>
            WhatsApp:{" "}
            <a href={`https://wa.me/${settings.whatsapp}`} className="font-medium text-[#D6A000]">
              Open chat
            </a>
          </li>
          <li>
            Email:{" "}
            <a href={`mailto:${settings.email}`} className="font-medium text-[#D6A000]">
              {settings.email}
            </a>
          </li>
          <li>{settings.address}</li>
          <li>{settings.hours}</li>
        </ul>
      </div>
      <ContactForm />
    </article>
  );
}
