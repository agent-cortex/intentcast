/**
 * In-Memory Store — Demo-grade persistence for intents, providers, and offers
 */

import { v4 as uuidv4 } from 'uuid';
import { Intent, CreateIntentInput, createIntent } from '../models/intent.js';
import { Provider, CreateProviderInput, createProvider } from '../models/provider.js';
import { Offer, CreateOfferInput, createOffer } from '../models/offer.js';

// In-memory storage
const intents = new Map<string, Intent>();
const providers = new Map<string, Provider>();
const offers = new Map<string, Offer>();

// Intent CRUD
export const intentStore = {
  create(input: CreateIntentInput): Intent {
    const id = `int_${uuidv4().slice(0, 8)}`;
    const intent = createIntent(input, id);
    intents.set(id, intent);
    return intent;
  },

  get(id: string): Intent | undefined {
    return intents.get(id);
  },

  list(filter?: { status?: string; category?: string }): Intent[] {
    let result = Array.from(intents.values());
    
    if (filter?.status) {
      result = result.filter(i => i.status === filter.status);
    }
    if (filter?.category) {
      result = result.filter(i => i.category === filter.category);
    }
    
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  update(id: string, updates: Partial<Intent>): Intent | undefined {
    const intent = intents.get(id);
    if (!intent) return undefined;
    
    const updated = { ...intent, ...updates, updatedAt: new Date() };
    intents.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return intents.delete(id);
  },

  getByWallet(wallet: string): Intent[] {
    return Array.from(intents.values()).filter(
      i => i.requesterWallet.toLowerCase() === wallet.toLowerCase()
    );
  },
};

// Provider CRUD
export const providerStore = {
  create(input: CreateProviderInput): Provider {
    const id = `prov_${uuidv4().slice(0, 8)}`;
    const provider = createProvider(input, id);
    providers.set(id, provider);
    return provider;
  },

  get(id: string): Provider | undefined {
    return providers.get(id);
  },

  list(filter?: { status?: string; capability?: string }): Provider[] {
    let result = Array.from(providers.values());
    
    if (filter?.status) {
      result = result.filter(p => p.status === filter.status);
    }
    if (filter?.capability) {
      const cap = filter.capability;
      result = result.filter(p => p.capabilities.includes(cap));
    }
    
    return result;
  },

  update(id: string, updates: Partial<Provider>): Provider | undefined {
    const provider = providers.get(id);
    if (!provider) return undefined;
    
    const updated = { ...provider, ...updates, lastSeen: new Date() };
    providers.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return providers.delete(id);
  },

  getByAgentId(agentId: string): Provider | undefined {
    return Array.from(providers.values()).find(p => p.agentId === agentId);
  },

  getByCapabilities(capabilities: string[]): Provider[] {
    return Array.from(providers.values()).filter(p =>
      capabilities.some(cap => p.capabilities.includes(cap))
    );
  },
};

// Offer CRUD
export const offerStore = {
  create(input: CreateOfferInput): Offer {
    const id = `off_${uuidv4().slice(0, 8)}`;
    const offer = createOffer(input, id);
    offers.set(id, offer);
    return offer;
  },

  get(id: string): Offer | undefined {
    return offers.get(id);
  },

  listByIntent(intentId: string): Offer[] {
    return Array.from(offers.values())
      .filter(o => o.intentId === intentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  listByProvider(providerId: string): Offer[] {
    return Array.from(offers.values())
      .filter(o => o.providerId === providerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  update(id: string, updates: Partial<Offer>): Offer | undefined {
    const offer = offers.get(id);
    if (!offer) return undefined;
    
    const updated = { ...offer, ...updates, updatedAt: new Date() };
    offers.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return offers.delete(id);
  },
};

// Store stats for health check
export function getStoreStats() {
  return {
    intents: intents.size,
    providers: providers.size,
    offers: offers.size,
    activeIntents: Array.from(intents.values()).filter(i => i.status === 'active').length,
    onlineProviders: Array.from(providers.values()).filter(p => p.status === 'online').length,
  };
}

// Clear all data (for testing)
export function clearStore() {
  intents.clear();
  providers.clear();
  offers.clear();
}
