import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAllFeedback } from "@/features/feedback/api";

/**
 * Subscribes to realtime changes on feedback + votes
 * and revalidates the SWR feedback caches.
 */
export function useRealtimeFeedback() {
  useEffect(() => {
    const channel = supabase
      .channel("feedback-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => invalidateAllFeedback()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => invalidateAllFeedback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
