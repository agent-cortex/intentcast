/**
 * Matching Service — Match intents to providers by capability
 */

import { intentStore, providerStore } from '../store/memory.js';
import { Intent } from '../models/intent.js';
import { Provider, getProviderCategories, getProviderPricing } from '../models/provider.js';

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
  const providerCats = getProviderCategories(provider);
  
  const matches: MatchResult[] = [];
  
  for (const intent of activeIntents) {
    const matchedCaps = getMatchedCapabilities(intent, provider, providerCats);
    
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
    const providerCats = getProviderCategories(provider);
    const matchedCaps = getMatchedCapabilities(intent, provider, providerCats);
    
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
function getMatchedCapabilities(intent: Intent, provider: Provider, providerCats: string[]): string[] {
  const intentCategory = intent.requires.category.toLowerCase();
  
  return providerCats.filter(cat => {
    const catLower = cat.toLowerCase();
    // Match if category equals or is related
    return catLower === intentCategory || 
           catLower.includes(intentCategory) || 
           intentCategory.includes(catLower);
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
  const categoryPricing = getProviderPricing(provider, intent.requires.category);
  if (categoryPricing) {
    const providerPrice = parseFloat(categoryPricing.basePrice);
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
  
  // Bonus for high-rated provider
  if (provider.rating && provider.rating >= 4.5) {
    score += 5;
  }
  
  // Check min rating requirement
  if (intent.requires.minRating && provider.rating) {
    if (provider.rating < intent.requires.minRating) {
      return 0; // Disqualify
    }
  }
  
  // Check min completed jobs requirement
  if (intent.requires.minCompletedJobs) {
    if (provider.completedJobs < intent.requires.minCompletedJobs) {
      return 0; // Disqualify
    }
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
