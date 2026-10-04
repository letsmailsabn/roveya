import { Logo } from "@/components/brand/Logo";

export function InProgress() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#12060D] px-6 py-16 text-[#F6F1DC]">
      <section className="w-full max-w-xl text-center">
        <Logo href="" />
        <p className="kicker mt-12">ROVEYA</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">The website is in progress</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-[#F6F1DC]/70">
          We are preparing the full ROVEYA experience. Thank you for visiting while the remaining details are finished.
        </p>
        <div className="gold-line mx-auto mt-10 max-w-xs" />
      </section>
    </main>
  );
}
