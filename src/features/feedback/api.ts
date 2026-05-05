import useSWR, { mutate as globalMutate } from "swr";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Enums"]["feedback_category"];
export const CATEGORIES: Category[] = ["Bug", "Feature", "Improvement"];

export interface FeedbackItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  created_at: string;
  image_url: string | null;
  is_hidden: boolean;
  is_pinned: boolean;
  pin_reason: string | null;
  hide_reason: string | null;
  vote_count: number;
  has_voted: boolean;
  user_vote_type: 1 | -1 | null;
  author_name: string | null;
  author_email: string | null;
  author_avatar: string | null;
  author_roles: string[];
}

export type SortKey = "votes" | "latest";

interface FetchArgs {
  id?: string;
  userId: string | null;
  category: Category | "All";
  search: string;
  sort: SortKey;
  includeHidden?: boolean;
  authorId?: string;
}

const FEEDBACK_KEY = "feedback-list";

export function feedbackKey(args: FetchArgs) {
  return [FEEDBACK_KEY, args] as const;
}

async function fetcher([, args]: readonly [string, FetchArgs]): Promise<FeedbackItem[]> {
  const { userId, category, search, sort, includeHidden } = args;

  let query = supabase
    .from("feedback")
    .select("id,user_id,title,description,category,created_at,is_hidden,is_pinned,pin_reason,hide_reason,image_url");

  if (args.id) {
    query = query.eq("id", args.id);
  } else {
    if (!includeHidden) query = query.eq("is_hidden", false);
    if (category !== "All") query = query.eq("category", category);
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }
    if (args.authorId) {
      query = query.eq("user_id", args.authorId);
    }
  }

  query = query.order("created_at", { ascending: false });

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map(r => r.id);
  const userIds = Array.from(new Set(rows.map(r => r.user_id)));

  const [{ data: votes }, { data: profiles, error: profileError }] = await Promise.all([
    supabase.from("votes").select("feedback_id,user_id,vote_type").in("feedback_id", ids),
    supabase.from("profiles").select("id,display_name,email,avatar_url").in("id", userIds),
  ]);

  let finalProfiles = profiles;
  if (profileError) {
    console.warn("Profiles with email failed, falling back:", profileError.message);
    const { data: fallback } = await supabase
      .from("profiles")
      .select("id,display_name,avatar_url")
      .in("id", userIds);
    finalProfiles = fallback as any;
  }

  const counts = new Map<string, number>();
  const userVotes = new Map<string, 1 | -1>();
  votes?.forEach(v => {
    counts.set(v.feedback_id, (counts.get(v.feedback_id) ?? 0) + (v.vote_type ?? 1));
    if (userId && v.user_id === userId) userVotes.set(v.feedback_id, (v.vote_type as 1 | -1) ?? 1);
  });
  const profileById = new Map(finalProfiles?.map(p => [p.id, p]) ?? []);

  const enriched: FeedbackItem[] = rows.map(r => {
    const profile = profileById.get(r.user_id);
    return {
      ...r,
      vote_count: counts.get(r.id) ?? 0,
      has_voted: userVotes.has(r.id),
      user_vote_type: userVotes.get(r.id) ?? null,
      author_name: profile?.display_name ?? null,
      author_email: profile?.email ?? null,
      author_avatar: profile?.avatar_url ?? null,
      author_roles: (profile as any)?.user_roles?.map((r: any) => r.role) || [],
    };
  });

  enriched.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (sort === "votes") return b.vote_count - a.vote_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return enriched;
}

export function useFeedback(args: FetchArgs) {
  return useSWR(feedbackKey(args), fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}

export function invalidateAllFeedback() {
  return globalMutate(
    (key) => Array.isArray(key) && key[0] === FEEDBACK_KEY,
    undefined,
    { revalidate: true }
  );
}

export async function createFeedback(input: { title: string; description: string; category: Category; image_url?: string | null }, userId: string) {
  const { title, description, category, image_url } = input;
  const { error } = await supabase.from("feedback").insert({ 
    title, 
    description, 
    category, 
    image_url, 
    user_id: userId 
  });
  if (error) throw error;
  await invalidateAllFeedback();
}

export async function updateFeedback(id: string, patch: { 
  title?: string; 
  description?: string; 
  category?: Category; 
  image_url?: string | null;
  is_hidden?: boolean;
  hide_reason?: string | null;
  is_pinned?: boolean;
  pin_reason?: string | null;
}) {
  const { error } = await supabase.from("feedback").update({
    ...patch,
    updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) throw error;
  await invalidateAllFeedback();
}

export async function updateUserRole(userId: string, role: any) {
  // First remove all roles for the user
  const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  
  // Then insert the new role
  const { error: insErr } = await supabase.from("user_roles").insert({
    user_id: userId,
    role: role
  });
  if (insErr) throw insErr;
}

export async function toggleVote(feedbackId: string, userId: string, currentlyVoted: boolean, type: 1 | -1 = 1) {
  // Check if the user is voting on their own post
  const { data: post } = await supabase.from("feedback").select("user_id").eq("id", feedbackId).single();
  if (post?.user_id === userId) {
    throw new Error("You cannot vote on your own post");
  }

  if (currentlyVoted) {
    const { data: existing } = await supabase.from("votes").select("vote_type").match({ feedback_id: feedbackId, user_id: userId }).maybeSingle();
    
    if (existing?.vote_type === type) {
      // Unvote if clicking the same type again
      const { error } = await supabase.from("votes").delete().match({ feedback_id: feedbackId, user_id: userId });
      if (error) throw error;
    } else {
      // Change vote type
      const { error } = await supabase.from("votes").update({ vote_type: type }).match({ feedback_id: feedbackId, user_id: userId });
      if (error) throw error;
    }
  } else {
    const { error } = await supabase.from("votes").insert({ feedback_id: feedbackId, user_id: userId, vote_type: type });
    if (error) throw error;
  }
}

export async function setFeedbackFlags(
  id: string,
  patch: { is_hidden?: boolean; is_pinned?: boolean; pin_reason?: string | null; hide_reason?: string | null },
  audit?: { adminId: string; title: string; reason?: string }
) {
  const { error } = await supabase.from("feedback").update(patch).eq("id", id);
  if (error) throw error;
  if (audit) {
    const action =
      patch.is_pinned === true ? "pin" :
      patch.is_pinned === false ? "unpin" :
      patch.is_hidden === true ? "hide" :
      patch.is_hidden === false ? "unhide" : "update";
    await supabase.from("admin_audit_log").insert({
      admin_id: audit.adminId, action, feedback_id: id,
      feedback_title: audit.title, reason: audit.reason ?? null,
    });
  }
  await invalidateAllFeedback();
}

export async function deleteFeedback(id: string, audit?: { adminId: string; title: string; reason?: string }) {
  if (audit) {
    await supabase.from("admin_audit_log").insert({
      admin_id: audit.adminId, action: "delete", feedback_id: id,
      feedback_title: audit.title, reason: audit.reason ?? null,
    });
  }
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) throw error;
  await invalidateAllFeedback();
}

export async function updateComment(id: string, content: string) {
  const { error } = await supabase.from("comments").update({ content }).eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export function useComments(feedbackId: string) {
  const fetcher = async () => {
    const { data: comments, error: commentError } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (
          display_name,
          avatar_url,
          email,
          user_roles!user_roles_user_id_fkey (role)
        )
      `)
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });

    if (commentError) throw commentError;
    return (comments || []).map(c => ({
      ...c,
      author: {
        name: (c.profiles as any)?.display_name || (c.profiles as any)?.email || "Anonymous",
        email: (c.profiles as any)?.email,
        avatar: (c.profiles as any)?.avatar_url,
        roles: (c.profiles as any)?.user_roles?.map((r: any) => r.role) || [],
      }
    }));
  };

  return useSWR(feedbackId ? ["comments", feedbackId] : null, fetcher, {
    revalidateOnFocus: true
  });
}

export async function createComment(feedbackId: string, userId: string, content: string) {
  const { error } = await supabase.from("comments").insert({ feedback_id: feedbackId, user_id: userId, content });
  if (error) throw error;
  await globalMutate(["comments", feedbackId]);
}
