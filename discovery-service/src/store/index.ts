/**
 * Store Export — Selects between memory and Supabase stores
 *
 * Behavior:
 * - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, use Supabase (persistent)
 * - Otherwise fall back to memory store (ephemeral)
 *
 * You can still force memory by setting STORE_TYPE=memory.
 */

const hasSupabaseEnv = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORE_TYPE = process.env.STORE_TYPE; // optional override: memory|supabase

const useSupabase = STORE_TYPE === 'supabase' || (STORE_TYPE !== 'memory' && hasSupabaseEnv);

let intentStore: any;
let providerStore: any;
let offerStore: any;
let getStoreStats: any;
let clearStore: any;

if (useSupabase) {
  console.log('Using Supabase store (persistent)');
  const supabaseStore = await import('./supabase.js');
  intentStore = supabaseStore.intentStore;
  providerStore = supabaseStore.providerStore;
  offerStore = supabaseStore.offerStore;
  getStoreStats = supabaseStore.getStoreStats;
  clearStore = supabaseStore.clearStore;
} else {
  console.log('Using memory store (ephemeral)');
  const memoryStore = await import('./memory.js');
  intentStore = memoryStore.intentStore;
  providerStore = memoryStore.providerStore;
  offerStore = memoryStore.offerStore;
  getStoreStats = memoryStore.getStoreStats;
  clearStore = memoryStore.clearStore;
}

export { intentStore, providerStore, offerStore, getStoreStats, clearStore };
