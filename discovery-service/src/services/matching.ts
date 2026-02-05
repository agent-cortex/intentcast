/**
 * Matching Service — Match intents to providers by capability
 */

import { intentStore, providerStore } from '../store/memory.js';
import { Intent } from '../models/intent.js';
import { Provider } from '../models/provider.js';

export interface MatchResult {
  intent: Intent;
  score: number;
  matchedCapabilities: string[];
}

/**
 * Find intents that match a provider's capabilities
 */
export function findMatchingIntents(providerId: string): MatchResult[] {
  const provider = providerStore.get(providerId);
  if (!provider) return [];
  
  // Get all active intents
  const activeIntents = intentStore.list({ status: 'active' });
  
  const matches: MatchResult[] = [];
  
  for (const intent of activeIntents) {
    const matchedCaps = getMatchedCapabilities(intent, provider);
    
    if (matchedCaps.length > 0) {
      const score = calculateMatchScore(intent, provider, matchedCaps);
      matches.push({
        intent,
        score,
        matchedCapabilities: matchedCaps,
      });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Find providers that can fulfill an intent
 */
export function findMatchingProviders(intentId: string): Array<{ provider: Provider; score: number; matchedCapabilities: string[] }> {
  const intent = intentStore.get(intentId);
  if (!intent) return [];
  
  // Get all online providers
  const onlineProviders = providerStore.list({ status: 'online' });
  
  const matches: Array<{ provider: Provider; score: number; matchedCapabilities: string[] }> = [];
  
  for (const provider of onlineProviders) {
    const matchedCaps = getMatchedCapabilities(intent, provider);
    
    if (matchedCaps.length > 0) {
      const score = calculateMatchScore(intent, provider, matchedCaps);
      matches.push({
        provider,
        score,
        matchedCapabilities: matchedCaps,
      });
    }
  }
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Get capabilities that match between intent and provider
 */
function getMatchedCapabilities(intent: Intent, provider: Provider): string[] {
  const intentCategory = intent.category.toLowerCase();
  
  return provider.capabilities.filter(cap => {
    const capLower = cap.toLowerCase();
    // Match if category equals capability or is a substring
    return capLower === intentCategory || 
           capLower.includes(intentCategory) || 
           intentCategory.includes(capLower);
  });
}

/**
 * Calculate match score (0-100)
 */
function calculateMatchScore(intent: Intent, provider: Provider, matchedCaps: string[]): number {
  let score = 0;
  
  // Base score for any match
  score += 50;
  
  // Bonus for multiple matched capabilities
  score += Math.min(matchedCaps.length * 10, 20);
  
  // Bonus if provider's pricing is within intent's max price
  const categoryPricing = provider.pricing[intent.category];
  if (categoryPricing) {
    const providerPrice = parseFloat(categoryPricing);
    const maxPrice = parseFloat(intent.maxPriceUsdc);
    
    if (providerPrice <= maxPrice) {
      // Better score for lower prices
      const priceRatio = providerPrice / maxPrice;
      score += Math.floor((1 - priceRatio) * 20);
    }
  }
  
  // Bonus for verified stake
  if (intent.stakeVerified) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Get match stats for monitoring
 */
export function getMatchStats() {
  const activeIntents = intentStore.list({ status: 'active' });
  const onlineProviders = providerStore.list({ status: 'online' });
  
  let totalPossibleMatches = 0;
  
  for (const intent of activeIntents) {
    const matches = findMatchingProviders(intent.id);
    totalPossibleMatches += matches.length;
  }
  
  return {
    activeIntents: activeIntents.length,
    onlineProviders: onlineProviders.length,
    potentialMatches: totalPossibleMatches,
    avgMatchesPerIntent: activeIntents.length > 0 
      ? (totalPossibleMatches / activeIntents.length).toFixed(2) 
      : '0',
  };
}
