import { Suspense } from "react";
import { PhoneGate } from "@/components/auth/PhoneGate";

export default function RegisterPage() {
  return (
    <Suspense>
      <PhoneGate />
    </Suspense>
  );
}
