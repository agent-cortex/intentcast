/**
 * Supabase Store — Persistent storage for intents, providers, and offers
 *
 * Drop-in replacement for memory.ts with the same method names.
 *
 * Requires:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY (server-side; bypasses RLS)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Intent, CreateIntentInput, createIntent } from '../models/intent.js';
import { Provider, CreateProviderInput, createProvider } from '../models/provider.js';
import { Offer, CreateOfferInput, createOffer } from '../models/offer.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('SUPABASE_URL not set');
if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

type IntentRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  argument_hint: string | null;
  input: any;
  output: any;
  requires: any;
  context: any | null;
  tags: string[] | null;
  urgency: string;
  max_price_usdc: string;
  stake_tx_hash: string;
  stake_verified: boolean;
  stake_amount: string;
  deadline: string;
  requester_wallet: string;
  status: string;
  accepted_offer_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProviderRow = {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  argument_hint: string | null;
  avatar_url: string | null;
  capabilities: any;
  pricing: any;
  tags: string[] | null;
  languages: string[] | null;
  wallet: string;
  status: string;
  completed_jobs: number;
  rating: number | null;
  rating_count: number;
  certifications: string[] | null;
  website_url: string | null;
  api_endpoint: string | null;
  x402: any | null;
  registered_at: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
};

type OfferRow = {
  id: string;
  intent_id: string;
  provider_id: string;
  price_usdc: string;
  price_breakdown: any | null;
  commitment: any;
  qualifications: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

function toIntent(row: IntentRow): Intent {
  return {
    id: row.id,
    type: row.type as Intent['type'],
    title: row.title,
    description: row.description ?? undefined,
    argumentHint: row.argument_hint ?? undefined,
    input: row.input,
    output: row.output,
    requires: row.requires,
    context: row.context ?? undefined,
    tags: row.tags ?? undefined,
    urgency: row.urgency as Intent['urgency'],
    maxPriceUsdc: row.max_price_usdc,
    stakeTxHash: row.stake_tx_hash,
    stakeVerified: row.stake_verified,
    stakeAmount: row.stake_amount,
    deadline: new Date(row.deadline),
    requesterWallet: row.requester_wallet,
    status: row.status as Intent['status'],
    acceptedOfferId: row.accepted_offer_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    agentId: row.agent_id,
    name: row.name,
    description: row.description ?? undefined,
    argumentHint: row.argument_hint ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    capabilities: row.capabilities,
    pricing: row.pricing,
    tags: row.tags ?? undefined,
    languages: row.languages ?? undefined,
    wallet: row.wallet,
    status: row.status as Provider['status'],
    completedJobs: row.completed_jobs,
    rating: row.rating === null || row.rating === undefined ? undefined : Number(row.rating),
    ratingCount: row.rating_count,
    certifications: row.certifications ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    apiEndpoint: row.api_endpoint ?? undefined,
    x402: row.x402 ?? undefined,
    registeredAt: new Date(row.registered_at),
    lastSeen: new Date(row.last_seen),
  };
}

function toOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    intentId: row.intent_id,
    providerId: row.provider_id,
    priceUsdc: row.price_usdc,
    priceBreakdown: row.price_breakdown ?? undefined,
    commitment: row.commitment,
    qualifications: row.qualifications ?? undefined,
    status: row.status as Offer['status'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

export const intentStore = {
  async create(input: CreateIntentInput): Promise<Intent> {
    const id = `int_${uuidv4().slice(0, 8)}`;
    const intent = createIntent(input, id);

    const { error } = await supabase.from('intents').insert({
      id: intent.id,
      type: intent.type,
      title: intent.title,
      description: intent.description,
      argument_hint: intent.argumentHint,
      input: intent.input,
      output: intent.output,
      requires: intent.requires,
      context: intent.context,
      tags: intent.tags,
      urgency: intent.urgency,
      max_price_usdc: intent.maxPriceUsdc,
      stake_tx_hash: intent.stakeTxHash,
      stake_verified: intent.stakeVerified,
      stake_amount: intent.stakeAmount,
      deadline: intent.deadline.toISOString(),
      requester_wallet: intent.requesterWallet,
      status: intent.status,
      accepted_offer_id: intent.acceptedOfferId,
    });

    if (error) throw new Error(`Failed to create intent: ${error.message}`);
    return intent;
  },

  async get(id: string): Promise<Intent | undefined> {
    const { data, error } = await supabase.from('intents').select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return toIntent(data as any);
  },

  async list(filter?: { status?: string; category?: string }): Promise<Intent[]> {
    let query = supabase.from('intents').select('*');
    if (filter?.status) query = query.eq('status', filter.status);
    if (filter?.category) query = query.eq('requires->>category', filter.category);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to list intents: ${error.message}`);

    return (data ?? []).map((r) => toIntent(r as any));
  },

  async update(id: string, updates: Partial<Intent>): Promise<Intent | undefined> {
    const updateData: Record<string, unknown> = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.stakeVerified !== undefined) updateData.stake_verified = updates.stakeVerified;
    if (updates.acceptedOfferId !== undefined) updateData.accepted_offer_id = updates.acceptedOfferId;

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.argumentHint !== undefined) updateData.argument_hint = updates.argumentHint;
    if (updates.input !== undefined) updateData.input = updates.input;
    if (updates.output !== undefined) updateData.output = updates.output;
    if (updates.requires !== undefined) updateData.requires = updates.requires;
    if (updates.context !== undefined) updateData.context = updates.context;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.urgency !== undefined) updateData.urgency = updates.urgency;

    if (updates.maxPriceUsdc !== undefined) updateData.max_price_usdc = updates.maxPriceUsdc;
    if (updates.stakeTxHash !== undefined) updateData.stake_tx_hash = updates.stakeTxHash;
    if (updates.stakeAmount !== undefined) updateData.stake_amount = updates.stakeAmount;

    if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
    if (updates.requesterWallet !== undefined) updateData.requester_wallet = updates.requesterWallet;

    const { data, error } = await supabase
      .from('intents')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) return undefined;
    return toIntent(data as any);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('intents').delete().eq('id', id);
    return !error;
  },

  async getByWallet(wallet: string): Promise<Intent[]> {
    const { data, error } = await supabase
      .from('intents')
      .select('*')
      // NOTE: wallet comparisons are case-insensitive; this works for exact strings too.
      .ilike('requester_wallet', wallet)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []).map((r) => toIntent(r as any));
  },
};

export const providerStore = {
  async create(input: CreateProviderInput): Promise<Provider> {
    const id = `prov_${uuidv4().slice(0, 8)}`;
    const provider = createProvider(input, id);

    const { error } = await supabase.from('providers').insert({
      id: provider.id,
      agent_id: provider.agentId,
      name: provider.name,
      description: provider.description,
      argument_hint: provider.argumentHint,
      avatar_url: provider.avatarUrl,
      capabilities: provider.capabilities,
      pricing: provider.pricing,
      tags: provider.tags,
      languages: provider.languages,
      wallet: provider.wallet,
      status: provider.status,
      completed_jobs: provider.completedJobs,
      rating: provider.rating,
      rating_count: provider.ratingCount,
      certifications: provider.certifications,
      website_url: provider.websiteUrl,
      api_endpoint: provider.apiEndpoint,
      x402: provider.x402,
      registered_at: provider.registeredAt.toISOString(),
      last_seen: provider.lastSeen.toISOString(),
    });

    if (error) throw new Error(`Failed to create provider: ${error.message}`);
    return provider;
  },

  async get(id: string): Promise<Provider | undefined> {
    const { data, error } = await supabase.from('providers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return toProvider(data as any);
  },

  async list(filter?: { status?: string; category?: string; x402Enabled?: boolean }): Promise<Provider[]> {
    let query = supabase.from('providers').select('*');
    if (filter?.status) query = query.eq('status', filter.status);
    // capabilities is an array of objects; contains works with jsonb.
    if (filter?.category) query = query.contains('capabilities', [{ category: filter.category }]);
    if (filter?.x402Enabled === true) {
      // PostgREST supports JSON operators in filters.
      query = query.eq('x402->>enabled', 'true');
    }

    const { data, error } = await query.order('registered_at', { ascending: false });
    if (error) throw new Error(`Failed to list providers: ${error.message}`);

    return (data ?? []).map((r) => toProvider(r as any));
  },

  async listX402Enabled(): Promise<Provider[]> {
    return this.list({ x402Enabled: true });
  },

  async update(id: string, updates: Partial<Provider>): Promise<Provider | undefined> {
    const updateData: Record<string, unknown> = {
      last_seen: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.argumentHint !== undefined) updateData.argument_hint = updates.argumentHint;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.capabilities !== undefined) updateData.capabilities = updates.capabilities;
    if (updates.pricing !== undefined) updateData.pricing = updates.pricing;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.wallet !== undefined) updateData.wallet = updates.wallet;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.completedJobs !== undefined) updateData.completed_jobs = updates.completedJobs;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.ratingCount !== undefined) updateData.rating_count = updates.ratingCount;
    if (updates.certifications !== undefined) updateData.certifications = updates.certifications;
    if (updates.websiteUrl !== undefined) updateData.website_url = updates.websiteUrl;
    if (updates.apiEndpoint !== undefined) updateData.api_endpoint = updates.apiEndpoint;
    if (updates.x402 !== undefined) updateData.x402 = updates.x402;

    const { data, error } = await supabase
      .from('providers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) return undefined;
    return toProvider(data as any);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('providers').delete().eq('id', id);
    return !error;
  },

  async getByAgentId(agentId: string): Promise<Provider | undefined> {
    const { data, error } = await supabase.from('providers').select('*').eq('agent_id', agentId).maybeSingle();
    if (error || !data) return undefined;
    return toProvider(data as any);
  },

  async getByCategory(category: string): Promise<Provider[]> {
    return this.list({ category });
  },
};

export const offerStore = {
  async create(input: CreateOfferInput): Promise<Offer> {
    const id = `off_${uuidv4().slice(0, 8)}`;
    const offer = createOffer(input, id);

    const { error } = await supabase.from('offers').insert({
      id: offer.id,
      intent_id: offer.intentId,
      provider_id: offer.providerId,
      price_usdc: offer.priceUsdc,
      price_breakdown: offer.priceBreakdown,
      commitment: offer.commitment,
      qualifications: offer.qualifications,
      status: offer.status,
      expires_at: offer.expiresAt?.toISOString(),
      created_at: offer.createdAt.toISOString(),
      updated_at: offer.updatedAt.toISOString(),
    });

    if (error) throw new Error(`Failed to create offer: ${error.message}`);
    return offer;
  },

  async get(id: string): Promise<Offer | undefined> {
    const { data, error } = await supabase.from('offers').select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return toOffer(data as any);
  },

  async listByIntent(intentId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('intent_id', intentId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data ?? []).map((r) => toOffer(r as any));
  },

  async listByProvider(providerId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data ?? []).map((r) => toOffer(r as any));
  },

  async update(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const updateData: Record<string, unknown> = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priceUsdc !== undefined) updateData.price_usdc = updates.priceUsdc;
    if (updates.priceBreakdown !== undefined) updateData.price_breakdown = updates.priceBreakdown;
    if (updates.commitment !== undefined) updateData.commitment = updates.commitment;
    if (updates.qualifications !== undefined) updateData.qualifications = updates.qualifications;
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt?.toISOString();

    const { data, error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) return undefined;
    return toOffer(data as any);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    return !error;
  },
};

export async function getStoreStats() {
  const [intentsRes, providersRes, offersRes] = await Promise.all([
    supabase.from('intents').select('status', { count: 'exact' }),
    supabase.from('providers').select('status', { count: 'exact' }),
    supabase.from('offers').select('id', { count: 'exact', head: true }),
  ]);

  const intents = (intentsRes.data ?? []) as Array<{ status: string }>;
  const providers = (providersRes.data ?? []) as Array<{ status: string }>;

  return {
    intents: intentsRes.count ?? intents.length,
    providers: providersRes.count ?? providers.length,
    offers: offersRes.count ?? 0,
    activeIntents: intents.filter((i) => i.status === 'active').length,
    onlineProviders: providers.filter((p) => p.status === 'online').length,
  };
}

export async function clearStore() {
  // order matters due to FK constraints
  await supabase.from('offers').delete().neq('id', '');
  await supabase.from('intents').delete().neq('id', '');
  await supabase.from('providers').delete().neq('id', '');
}
