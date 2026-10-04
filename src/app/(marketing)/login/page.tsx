import { Suspense } from "react";
import { PhoneGate } from "@/components/auth/PhoneGate";

export default function LoginPage() {
  return (
    <Suspense>
      <PhoneGate />
    </Suspense>
  );
}
