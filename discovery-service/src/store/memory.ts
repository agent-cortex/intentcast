/**
 * In-Memory Store — Demo-grade persistence for intents, providers, and offers
 */

import { v4 as uuidv4 } from 'uuid';
import { Intent, CreateIntentInput, createIntent } from '../models/intent.js';
import { Provider, CreateProviderInput, createProvider, getProviderCategories } from '../models/provider.js';
import { Offer, CreateOfferInput, createOffer } from '../models/offer.js';

// In-memory storage
const intents = new Map<string, Intent>();
const providers = new Map<string, Provider>();
const offers = new Map<string, Offer>();

// Intent CRUD
export const intentStore = {
  async create(input: CreateIntentInput): Promise<Intent> {
    const id = `int_${uuidv4().slice(0, 8)}`;
    const intent = createIntent(input, id);
    intents.set(id, intent);
    return intent;
  },

  async get(id: string): Promise<Intent | undefined> {
    return intents.get(id);
  },

  async list(filter?: { status?: string; category?: string }): Promise<Intent[]> {
    let result = Array.from(intents.values());

    if (filter?.status) {
      result = result.filter((i) => i.status === filter.status);
    }
    if (filter?.category) {
      result = result.filter((i) => i.requires.category === filter.category);
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async update(id: string, updates: Partial<Intent>): Promise<Intent | undefined> {
    const intent = intents.get(id);
    if (!intent) return undefined;

    const updated = { ...intent, ...updates, updatedAt: new Date() };
    intents.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    return intents.delete(id);
  },

  async getByWallet(wallet: string): Promise<Intent[]> {
    return Array.from(intents.values()).filter(
      (i) => i.requesterWallet.toLowerCase() === wallet.toLowerCase()
    );
  },
};

// Provider CRUD
export const providerStore = {
  async create(input: CreateProviderInput): Promise<Provider> {
    const id = `prov_${uuidv4().slice(0, 8)}`;
    const provider = createProvider(input, id);
    providers.set(id, provider);
    return provider;
  },

  async get(id: string): Promise<Provider | undefined> {
    return providers.get(id);
  },

  async list(filter?: { status?: string; category?: string; x402Enabled?: boolean }): Promise<Provider[]> {
    let result = Array.from(providers.values());

    if (filter?.status) {
      result = result.filter((p) => p.status === filter.status);
    }
    if (filter?.category) {
      const cat = filter.category;
      result = result.filter((p) => getProviderCategories(p).includes(cat));
    }
    if (filter?.x402Enabled === true) {
      result = result.filter((p) => p.x402?.enabled === true);
    }

    return result;
  },

  async listX402Enabled(): Promise<Provider[]> {
    return this.list({ x402Enabled: true });
  },

  async update(id: string, updates: Partial<Provider>): Promise<Provider | undefined> {
    const provider = providers.get(id);
    if (!provider) return undefined;

    const updated = { ...provider, ...updates, lastSeen: new Date() };
    providers.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    return providers.delete(id);
  },

  async getByAgentId(agentId: string): Promise<Provider | undefined> {
    return Array.from(providers.values()).find((p) => p.agentId === agentId);
  },

  async getByCategory(category: string): Promise<Provider[]> {
    return Array.from(providers.values()).filter((p) =>
      getProviderCategories(p).includes(category)
    );
  },
};

// Offer CRUD
export const offerStore = {
  async create(input: CreateOfferInput): Promise<Offer> {
    const id = `off_${uuidv4().slice(0, 8)}`;
    const offer = createOffer(input, id);
    offers.set(id, offer);
    return offer;
  },

  async get(id: string): Promise<Offer | undefined> {
    return offers.get(id);
  },

  async listByIntent(intentId: string): Promise<Offer[]> {
    return Array.from(offers.values())
      .filter((o) => o.intentId === intentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async listByProvider(providerId: string): Promise<Offer[]> {
    return Array.from(offers.values())
      .filter((o) => o.providerId === providerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async update(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = offers.get(id);
    if (!offer) return undefined;

    const updated = { ...offer, ...updates, updatedAt: new Date() };
    offers.set(id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    return offers.delete(id);
  },
};

// Store stats for health check
export async function getStoreStats() {
  return {
    intents: intents.size,
    providers: providers.size,
    offers: offers.size,
    activeIntents: Array.from(intents.values()).filter((i) => i.status === 'active').length,
    onlineProviders: Array.from(providers.values()).filter((p) => p.status === 'online').length,
  };
}

// Clear all data (for testing)
export async function clearStore() {
  intents.clear();
  providers.clear();
  offers.clear();
}
