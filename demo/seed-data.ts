/**
 * Seed sample data for IntentCast demo
 * 
 * Run: npx ts-node demo/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vcsgadomfxliglfkdmau.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sampleProviders = [
  {
    id: `prov_${uuidv4().slice(0, 8)}`,
    agent_id: 'summarizer-pro',
    name: 'Summarizer Pro',
    description: 'Fast, accurate document summarization. Handles PDFs, URLs, and raw text.',
    capabilities: [
      {
        category: 'research',
        name: 'summarization',
        description: 'Summarize documents, articles, and reports',
        acceptsInputTypes: ['text', 'url', 'file'],
        producesOutputFormats: ['markdown', 'text'],
      },
    ],
    pricing: [{ category: 'research', basePrice: '0.05', unit: 'per_request' }],
    wallet: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'online',
    x402: { enabled: true, network: 'eip155:84532', scheme: 'exact', defaultPrice: '$0.05' },
    agent_id_8004: '42',
    agent_id_8004_chain: 'sepolia',
  },
  {
    id: `prov_${uuidv4().slice(0, 8)}`,
    agent_id: 'code-reviewer',
    name: 'Code Review Bot',
    description: 'Automated code review with security analysis and best practices.',
    capabilities: [
      {
        category: 'development',
        name: 'code-review',
        description: 'Review code for bugs, security issues, and style',
        acceptsInputTypes: ['text', 'url'],
        producesOutputFormats: ['markdown', 'json'],
      },
    ],
    pricing: [{ category: 'development', basePrice: '0.10', unit: 'per_request' }],
    wallet: '0xabcdef1234567890abcdef1234567890abcdef12',
    status: 'online',
    x402: { enabled: true, network: 'eip155:84532', scheme: 'exact', defaultPrice: '$0.10' },
  },
  {
    id: `prov_${uuidv4().slice(0, 8)}`,
    agent_id: 'translator-ai',
    name: 'Universal Translator',
    description: 'High-quality translation across 50+ languages with context awareness.',
    capabilities: [
      {
        category: 'content',
        name: 'translation',
        description: 'Translate text between languages',
        acceptsInputTypes: ['text'],
        acceptsLanguages: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'],
        producesOutputFormats: ['text'],
      },
    ],
    pricing: [{ category: 'content', basePrice: '0.02', unit: 'per_word' }],
    wallet: '0x9876543210fedcba9876543210fedcba98765432',
    status: 'online',
    x402: { enabled: true, network: 'eip155:84532', scheme: 'exact', defaultPrice: '$0.50' },
  },
  {
    id: `prov_${uuidv4().slice(0, 8)}`,
    agent_id: 'data-scraper',
    name: 'Web Scraper Pro',
    description: 'Extract structured data from any website. Handles dynamic content.',
    capabilities: [
      {
        category: 'data',
        name: 'web-scraping',
        description: 'Scrape and structure web data',
        acceptsInputTypes: ['url'],
        producesOutputFormats: ['json', 'csv'],
      },
    ],
    pricing: [{ category: 'data', basePrice: '0.15', unit: 'per_request' }],
    wallet: '0xfedcba9876543210fedcba9876543210fedcba98',
    status: 'online',
    x402: { enabled: true, network: 'eip155:84532', scheme: 'exact', defaultPrice: '$0.15' },
    agent_id_8004: '108',
    agent_id_8004_chain: 'ethereum',
  },
];

const sampleIntents = [
  {
    id: `int_${uuidv4().slice(0, 8)}`,
    type: 'service_request',
    title: 'Summarize quarterly earnings report',
    description: 'Need a 500-word executive summary of Q4 2025 earnings report',
    input: { type: 'url', value: 'https://example.com/earnings-q4-2025.pdf' },
    output: { format: 'markdown', maxLength: 500 },
    requires: { category: 'research', capabilities: ['summarization'] },
    max_price_usdc: '1.00',
    stake_tx_hash: '0x' + 'a'.repeat(64),
    stake_verified: true,
    stake_amount: '1.00',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requester_wallet: '0x1111111111111111111111111111111111111111',
    status: 'active',
  },
  {
    id: `int_${uuidv4().slice(0, 8)}`,
    type: 'service_request',
    title: 'Review Python backend code',
    description: 'Security audit and code review for FastAPI backend (500 lines)',
    input: { type: 'url', value: 'https://github.com/example/api' },
    output: { format: 'markdown' },
    requires: { category: 'development', capabilities: ['code-review'] },
    max_price_usdc: '5.00',
    stake_tx_hash: '0x' + 'b'.repeat(64),
    stake_verified: true,
    stake_amount: '5.00',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    requester_wallet: '0x2222222222222222222222222222222222222222',
    status: 'active',
  },
  {
    id: `int_${uuidv4().slice(0, 8)}`,
    type: 'service_request',
    title: 'Translate marketing copy to Spanish',
    description: 'Translate 2000-word landing page copy to Latin American Spanish',
    input: { type: 'text', value: 'Landing page content...' },
    output: { format: 'text', language: 'es' },
    requires: { category: 'content', capabilities: ['translation'] },
    max_price_usdc: '40.00',
    stake_tx_hash: '0x' + 'c'.repeat(64),
    stake_verified: true,
    stake_amount: '40.00',
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    requester_wallet: '0x3333333333333333333333333333333333333333',
    status: 'active',
  },
];

async function seed() {
  console.log('🌱 Seeding IntentCast data...\n');

  // Insert providers
  console.log('📦 Inserting providers...');
  for (const provider of sampleProviders) {
    const { error } = await supabase.from('providers').upsert(provider, { onConflict: 'agent_id' });
    if (error) {
      console.error(`  ❌ ${provider.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${provider.name}${provider.agent_id_8004 ? ' (8004: #' + provider.agent_id_8004 + ')' : ''}`);
    }
  }

  // Insert intents
  console.log('\n📋 Inserting intents...');
  for (const intent of sampleIntents) {
    const { error } = await supabase.from('intents').upsert(intent, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ ${intent.title}: ${error.message}`);
    } else {
      console.log(`  ✅ ${intent.title}`);
    }
  }

  // Stats
  const { data: providerCount } = await supabase.from('providers').select('id', { count: 'exact', head: true });
  const { data: intentCount } = await supabase.from('intents').select('id', { count: 'exact', head: true });

  console.log('\n📊 Final counts:');
  console.log(`  Providers: ${providerCount}`);
  console.log(`  Intents: ${intentCount}`);
  console.log('\n✨ Done!');
}

seed().catch(console.error);
