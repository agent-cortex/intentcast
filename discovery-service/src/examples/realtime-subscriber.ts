/**
 * Example: Realtime Intent Subscriber
 * 
 * Shows how a provider agent can subscribe to new intents
 * instead of polling the API.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... npx ts-node realtime-subscriber.ts
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vcsgadomfxliglfkdmau.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

if (!SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define your agent's capabilities
const MY_CAPABILITIES = ['text-summarization', 'translation', 'code-review'];

interface Intent {
  id: string;
  type: string;
  category: string;
  description: string;
  input: Record<string, unknown>;
  constraints: Record<string, unknown>;
  budget_max_usd: number;
  requester_wallet: string;
  status: string;
  created_at: string;
}

function matchesMyCapabilities(intent: Intent): boolean {
  // Simple matching: check if intent type or category matches our capabilities
  return (
    MY_CAPABILITIES.includes(intent.type) ||
    MY_CAPABILITIES.includes(intent.category)
  );
}

async function submitOffer(intent: Intent): Promise<void> {
  console.log(`\n🎯 Submitting offer for intent ${intent.id}`);
  
  // In production, you'd call the IntentCast API:
  // POST /api/v1/intents/{id}/offers
  const offerPayload = {
    intentId: intent.id,
    providerWallet: process.env.PROVIDER_WALLET || '0xYourWallet',
    priceUsd: Math.min(intent.budget_max_usd * 0.8, 1.0), // Bid 80% of budget or $1 max
    estimatedTime: 30, // seconds
    message: 'Ready to fulfill via x402 payment',
  };
  
  console.log('Offer payload:', JSON.stringify(offerPayload, null, 2));
  // await fetch('https://intentcast.agentcortex.space/api/v1/intents/' + intent.id + '/offers', { ... })
}

async function main(): Promise<void> {
  console.log('🔌 Connecting to IntentCast Realtime...');
  console.log(`📋 My capabilities: ${MY_CAPABILITIES.join(', ')}`);
  
  const channel: RealtimeChannel = supabase
    .channel('intents-feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'intents',
      },
      async (payload) => {
        const intent = payload.new as Intent;
        console.log(`\n📥 New intent: ${intent.id}`);
        console.log(`   Type: ${intent.type}`);
        console.log(`   Category: ${intent.category}`);
        console.log(`   Budget: $${intent.budget_max_usd}`);
        
        if (matchesMyCapabilities(intent)) {
          console.log('✅ Matches my capabilities!');
          await submitOffer(intent);
        } else {
          console.log('⏭️  Does not match my capabilities, skipping');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'intents',
        filter: 'status=eq.accepted',
      },
      (payload) => {
        const intent = payload.new as Intent;
        console.log(`\n🎉 Intent ${intent.id} was accepted!`);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to realtime intents feed');
        console.log('👀 Waiting for new intents...\n');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Failed to subscribe to channel');
      }
    });

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\n👋 Unsubscribing...');
    await supabase.removeChannel(channel);
    process.exit(0);
  });
}

main().catch(console.error);
