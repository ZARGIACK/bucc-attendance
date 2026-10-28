"use client";

/**
 * Realtime hook.
 *
 * NOTE FOR SERVERLESS / VERCEL:
 * Persistent Server-Sent Events (EventSource) connections on Vercel keep
 * serverless lambda instances continuously active 24/7, causing severe
 * Fluid Provisioned Memory (GB-Hrs) quota exhaustion.
 *
 * Data refreshes reliably across the app via SWR's interval and focus revalidation,
 * so persistent streaming is disabled here to keep Vercel execution cost at near-zero.
 */
import type { RealtimeEvent } from "@/lib/realtime";

export function useRealtime(_onEvent?: (e: RealtimeEvent) => void) {
  // SWR handles data fetching, polling intervals, and window-focus revalidation
  // without keeping long-lived HTTP streams open on serverless lambdas.
}
