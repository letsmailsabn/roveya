type OtpEntry = { code: string; expires: number; attempts: number };

const globalStore = globalThis as typeof globalThis & { __roveyaPhoneOtp?: Map<string, OtpEntry> };

function store() {
  if (!globalStore.__roveyaPhoneOtp) globalStore.__roveyaPhoneOtp = new Map();
  return globalStore.__roveyaPhoneOtp;
}

export function issuePhoneOtp(phone: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  store().set(phone, { code, expires: Date.now() + 5 * 60 * 1000, attempts: 0 });
  return code;
}

export function checkPhoneOtp(phone: string, code: string) {
  const entry = store().get(phone);
  if (!entry || entry.expires < Date.now()) {
    store().delete(phone);
    return "That code has expired. Request a new one.";
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    store().delete(phone);
    return "Too many attempts. Request a new code.";
  }
  if (entry.code !== code.trim()) return "That code does not match.";
  store().delete(phone);
  return null;
}
