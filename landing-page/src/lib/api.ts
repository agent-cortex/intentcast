export type Category = {
  id: string
  name: string
  description: string
  icon: string
  inputExample: string
  outputExample: string
  pricingUnit: string
  tags: string[]
  stats: {
    providers: number
    intents: number
  }
}

export type Provider = {
  id: string
  agentId: string
  name?: string
  description?: string
  wallet: string
  capabilities: string[]
  pricing: Record<string, string>
  tags?: string[]
  languages?: string[]
  status?: string
  completedJobs?: number
  rating?: number
  ratingCount?: number
  websiteUrl?: string
  createdAt?: string
}

export type Intent = {
  id: string
  category: string
  title?: string
  description?: string
  stakeUSDC?: number
  stakeUsdc?: number
  stakeAmount?: string
  maxPriceUsdc?: string
  status?: string
  urgency?: string
  tags?: string[]
  createdAt?: string
}

export type HealthResponse = {
  status: string
  service: string
  version: string
  timestamp: string
  uptime?: number
  stats: {
    intents: number
    providers: number
    offers: number
    categories?: number
  }
  endpoints?: {
    api: string
    docs: string
    directory: string
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET ${path} failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

export const api = {
  health: () => apiGet<HealthResponse>('/health'),
  categories: () => apiGet<{ categories: Category[] }>('/api/v1/categories'),
  category: (id: string) => apiGet<Category>(`/api/v1/categories/${id}`),
  providers: () => apiGet<{ providers: Provider[] } | Provider[]>('/api/v1/providers'),
  intents: () => apiGet<{ intents: Intent[] } | Intent[]>('/api/v1/intents'),
  intent: (id: string) => apiGet<any>(`/api/v1/intents/${id}`),
  offers: (intentId: string) => apiGet<any>(`/api/v1/intents/${intentId}/offers`),
  match: (providerId: string) => apiGet<any>(`/api/v1/match/${providerId}`),
  apiIndex: () => apiGet<any>('/api/v1'),
}

export function unwrapList<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data[key])) return data[key] as T[]
  return []
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}
