import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Strategy ID ranges by tier
const TIER_STRATEGY_RANGES: Record<string, { start: number; end: number } | null> = {
  Essentials: null,
  Foundation: { start: 1, end: 13 },
  Complete: { start: 1, end: 30 },
  Premium: { start: 1, end: 59 },
};

export const useBackfillStrategies = (userId: string | undefined) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;
    hasRun.current = true;

    const backfill = async () => {
      try {
        // Get all clients for this user
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, package_tier");

        if (clientsError) throw clientsError;
        if (!clients || clients.length === 0) return;

        // Get all client_strategies to check which clients need backfill
        const { data: existingStrategies, error: strategiesError } = await supabase
          .from("client_strategies")
          .select("client_id");

        if (strategiesError) throw strategiesError;

        // Create a set of client IDs that already have strategies
        const clientsWithStrategies = new Set(
          existingStrategies?.map((cs) => cs.client_id) || []
        );

        // Find clients that need backfill (have ZERO strategies)
        const clientsToBackfill = clients.filter(
          (c) => !clientsWithStrategies.has(c.id) && TIER_STRATEGY_RANGES[c.package_tier]
        );

        if (clientsToBackfill.length === 0) return;

        // Get all strategies
        const { data: allStrategies, error: allStrategiesError } = await supabase
          .from("strategies")
          .select("id");

        if (allStrategiesError) throw allStrategiesError;

        // Build insert records for all clients needing backfill
        const insertRecords: { client_id: string; strategy_id: number; status: string }[] = [];

        for (const client of clientsToBackfill) {
          const range = TIER_STRATEGY_RANGES[client.package_tier];
          if (!range) continue;

          const strategiesForClient = allStrategies?.filter(
            (s) => s.id >= range.start && s.id <= range.end
          );

          strategiesForClient?.forEach((s) => {
            insertRecords.push({
              client_id: client.id,
              strategy_id: s.id,
              status: "not_started",
            });
          });
        }

        if (insertRecords.length > 0) {
          const { error: insertError } = await supabase
            .from("client_strategies")
            .insert(insertRecords);

          if (insertError) throw insertError;
          console.log(`Backfilled ${insertRecords.length} strategies for ${clientsToBackfill.length} clients`);
        }
      } catch (error) {
        console.error("Error backfilling strategies:", error);
      }
    };

    backfill();
  }, [userId]);
};
