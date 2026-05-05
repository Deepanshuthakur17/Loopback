import useSWR from "swr";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "manager" | "member" | "user";

async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

export function useRole() {
  const { user } = useAuth();
  const { data, isLoading } = useSWR(
    user ? ["user-roles", user.id] : null,
    () => fetchRoles(user!.id),
    { revalidateOnFocus: false }
  );
  const roles = data ?? [];
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isManager: roles.includes("manager") || roles.includes("admin"),
    isMember: roles.includes("member"),
    isSimpleUser: roles.includes("user") || roles.length === 0,
    canPostAndVote: roles.includes("admin") || roles.includes("manager") || roles.includes("member"),
    canModerate: roles.includes("admin") || roles.includes("manager"),
    loading: isLoading,
  };
}
