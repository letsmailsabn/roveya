import "server-only";
import { cookies } from "next/headers";
import { assertCeo, assertStaff, type StaffRole } from "@/lib/domain/authz";
import { isLocalAdminEnabled, LOCAL_ADMIN_COOKIE, LOCAL_ADMIN_TOKEN } from "@/lib/dev-mode";
import { AppError } from "@/lib/errors";
import { createStaffClient } from "@/lib/supabase/server";

export type StaffSession = {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  role: StaffRole;
};

export async function readAdminSession(): Promise<StaffSession | null> {
  if (isLocalAdminEnabled()) {
    const jar = await cookies();
    if (jar.get(LOCAL_ADMIN_COOKIE)?.value !== LOCAL_ADMIN_TOKEN) return null;
    return {
      id: "local-ceo",
      authUserId: "local-ceo",
      email: "ceo@roveya.com",
      name: "ROVEYA CEO",
      role: "CEO",
    };
  }
  try {
    const supabase = await createStaffClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: row } = await supabase
      .from("admin_users")
      .select("id,name,email,role")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();
    if (!row) return null;
    const role = assertStaff(row.role);
    return { id: row.id, authUserId: data.user.id, email: row.email, name: row.name, role };
  } catch {
    return null;
  }
}

export async function requireStaff() {
  const session = await readAdminSession();
  if (!session) throw new AppError("Unauthorized", 401);
  return session;
}

export async function requireCeo() {
  const session = await requireStaff();
  assertCeo(session.role);
  return session;
}
