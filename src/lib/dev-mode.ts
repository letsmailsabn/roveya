export const LOCAL_ADMIN_COOKIE = "roveya_dev_admin";
export const LOCAL_ADMIN_TOKEN = "local-ceo";

export function isLocalAdminEnabled() {
  return process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function localAdminEmail() {
  return (process.env.DEV_ADMIN_EMAIL ?? "ceo@roveya.com").toLowerCase();
}

export function localAdminPassword() {
  return process.env.DEV_ADMIN_PASSWORD ?? "ChangeMeNow!Roveya";
}
