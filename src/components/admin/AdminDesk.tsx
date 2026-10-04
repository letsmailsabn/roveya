"use client";

import { useEffect, useState } from "react";
import { formatInr, formatMobileDisplay } from "@/lib/validation";
import { Logo } from "@/components/brand/Logo";

type Tab = "rides" | "destinations" | "customers" | "messages" | "testimonials" | "qr" | "settings";

export function AdminDesk() {
  const [tab, setTab] = useState<Tab>("rides");
  const [rides, setRides] = useState<Record<string, unknown>[]>([]);
  const [destinations, setDestinations] = useState<Record<string, unknown>[]>([]);
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [testimonials, setTestimonials] = useState<Record<string, unknown>[]>([]);
  const [qr, setQr] = useState<{ url: string; qrDataUrl: string } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  async function refresh() {
    const [r, d, c, m, t, q, s] = await Promise.all([
      fetch("/api/admin/rides").then((x) => x.json()),
      fetch("/api/admin/destinations").then((x) => x.json()),
      fetch("/api/admin/customers").then((x) => x.json()),
      fetch("/api/admin/messages").then((x) => x.json()),
      fetch("/api/admin/testimonials").then((x) => x.json()),
      fetch("/api/admin/vehicle-qr").then((x) => x.json()),
      fetch("/api/admin/settings").then((x) => x.json()),
    ]);
    setRides(Array.isArray(r) ? r : []);
    setDestinations(Array.isArray(d) ? d : []);
    setCustomers(Array.isArray(c) ? c : []);
    setMessages(Array.isArray(m) ? m : []);
    setTestimonials(Array.isArray(t) ? t : []);
    setQr(q.url ? q : null);
    setSettings(s);
  }

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      if (tab === "rides") {
        void fetch("/api/admin/rides")
          .then((x) => x.json())
          .then((r) => setRides(Array.isArray(r) ? r : []));
      }
    }, 4000);
    return () => clearInterval(id);
  }, [tab]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Logo href="/" compact />
          <h1 className="display mt-3 text-3xl">Operations desk</h1>
        </div>
        <button type="button" onClick={() => void logout()} className="text-xs tracking-[0.16em] uppercase text-[#600042]">
          Sign out
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["rides", "Rides"],
            ["destinations", "Destinations"],
            ["customers", "Customers"],
            ["messages", "Messages"],
            ["testimonials", "Testimonials"],
            ["qr", "Vehicle QR"],
            ["settings", "Settings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-xs tracking-[0.14em] uppercase ${
              tab === id ? "bg-[#600042] text-[#F9F7E2]" : "bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rides" ? (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-black/50">
              <tr>
                <th className="py-2">Ride</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Total</th>
                <th>Method</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rides.map((ride) => (
                <tr key={String(ride.id)} className="border-t border-black/5">
                  <td className="py-3 font-medium">{String(ride.publicId)}</td>
                  <td>
                    {String(ride.customerName)}
                    <div className="text-xs text-black/50">{formatMobileDisplay(String(ride.mobile))}</div>
                  </td>
                  <td>
                    {String(ride.destinationName)} · {String(ride.seats)} seat{Number(ride.seats) > 1 ? "s" : ""}
                  </td>
                  <td>{formatInr(Number(ride.totalFare))}</td>
                  <td>{String(ride.paymentMethod ?? "—")}</td>
                  <td>{String(ride.paymentStatus)}</td>
                  <td>
                    {ride.paymentStatus === "PENDING" && ride.paymentMethod === "CASH" ? (
                      <button
                        className="text-xs tracking-[0.12em] text-[#600042]"
                        onClick={async () => {
                          await fetch(`/api/admin/rides/${ride.publicId}/confirm-cash`, { method: "POST" });
                          await refresh();
                        }}
                      >
                        Confirm cash
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "destinations" ? (
        <div className="mt-6 grid gap-4">
          {destinations.map((d) => (
            <form
              key={String(d.id)}
              className="grid gap-3 rounded-3xl bg-white p-5 md:grid-cols-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                await fetch(`/api/admin/destinations/${d.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: form.get("name"),
                    farePerSeat: Number(form.get("farePerSeat")),
                    description: form.get("description"),
                    active: form.get("active") === "on",
                  }),
                });
                await refresh();
              }}
            >
              <input name="name" defaultValue={String(d.name)} className="rounded-xl bg-[#EFEFEF] px-3 py-2" />
              <input name="farePerSeat" type="number" defaultValue={Number(d.farePerSeat)} className="rounded-xl bg-[#EFEFEF] px-3 py-2" />
              <input name="description" defaultValue={String(d.description ?? "")} className="rounded-xl bg-[#EFEFEF] px-3 py-2 md:col-span-2" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={Boolean(d.active)} />
                Active
              </label>
              <button className="rounded-full bg-[#600042] px-4 py-2 text-xs tracking-[0.14em] text-[#F9F7E2] md:col-span-5">
                SAVE
              </button>
            </form>
          ))}
          <form
            className="grid gap-3 rounded-3xl border border-dashed border-[#600042]/30 p-5 md:grid-cols-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await fetch("/api/admin/destinations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  farePerSeat: Number(form.get("farePerSeat")),
                  description: form.get("description"),
                }),
              });
              e.currentTarget.reset();
              await refresh();
            }}
          >
            <input name="name" required placeholder="New destination" className="rounded-xl bg-white px-3 py-2" />
            <input name="farePerSeat" required type="number" placeholder="Fare per seat" className="rounded-xl bg-white px-3 py-2" />
            <input name="description" placeholder="Short description" className="rounded-xl bg-white px-3 py-2" />
            <button className="rounded-full bg-[#600042] px-4 py-2 text-xs tracking-[0.14em] text-[#F9F7E2]">ADD</button>
          </form>
        </div>
      ) : null}

      {tab === "customers" ? (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-black/50">
              <tr>
                <th className="py-2">Name</th>
                <th>Mobile</th>
                <th>Rides</th>
                <th>Seats</th>
                <th>Spent</th>
                <th>Avg rating</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={String(c.id)} className="border-t border-black/5">
                  <td className="py-3">{String(c.name)}</td>
                  <td>{formatMobileDisplay(String(c.mobile))}</td>
                  <td>{String(c.totalRides)}</td>
                  <td>{String(c.totalSeats)}</td>
                  <td>{formatInr(Number(c.totalSpent))}</td>
                  <td>{c.averageRating ? String(c.averageRating) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "messages" ? (
        <div className="mt-6 grid gap-4">
          {messages.map((m) => (
            <article key={String(m.id)} className="rounded-3xl bg-white p-5">
              <p className="font-semibold">
                {String(m.name)} · {formatMobileDisplay(String(m.mobile))}
              </p>
              <p className="mt-2 text-sm text-black/70">{String(m.message)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "testimonials" ? (
        <div className="mt-6 grid gap-4">
          {testimonials.map((t) => (
            <article key={String(t.id)} className="flex items-start justify-between gap-4 rounded-3xl bg-white p-5">
              <div>
                <p className="font-semibold">{String(t.name)}</p>
                <p className="mt-2 text-sm text-black/70">“{String(t.quote)}”</p>
              </div>
              <button
                className="text-xs tracking-[0.12em] text-[#600042]"
                onClick={async () => {
                  await fetch("/api/admin/testimonials", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: t.id, published: !t.published }),
                  });
                  await refresh();
                }}
              >
                {t.published ? "Unpublish" : "Publish"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "qr" && qr ? (
        <div className="mt-8 rounded-3xl bg-[#F9F7E2] p-8 text-center">
          <h2 className="text-2xl font-semibold">In-vehicle QR</h2>
          <p className="mt-2 text-sm text-black/60">
            This opens Pay for your ride. Print the card and stick it flat inside the vehicle.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.qrDataUrl} alt="ROVEYA vehicle payment QR" className="mx-auto mt-6 h-64 w-64 bg-white" />
          <p className="mt-4 text-sm">{qr.url}</p>
          <a href="/pay/sticker" className="mt-5 inline-block text-sm font-semibold text-[#600042]">
            Open the print card
          </a>
        </div>
      ) : null}

      {tab === "settings" && settings.phone ? (
        <form
          key="settings"
          className="mt-6 grid gap-4 rounded-3xl bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await fetch("/api/admin/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(form.entries())),
            });
            await refresh();
          }}
        >
          {["phone", "whatsapp", "email", "address", "hours", "instagramUrl", "facebookUrl", "twitterUrl"].map(
            (key) => (
              <label key={key} className="text-xs uppercase tracking-[0.14em]">
                {key}
                <input name={key} defaultValue={settings[key] ?? ""} className="mt-2 w-full rounded-xl bg-[#EFEFEF] px-3 py-2 text-sm normal-case" />
              </label>
            ),
          )}
          <button className="rounded-full bg-[#600042] px-6 py-3 text-xs tracking-[0.16em] text-[#F9F7E2]">SAVE SETTINGS</button>
        </form>
      ) : null}
    </div>
  );
}
