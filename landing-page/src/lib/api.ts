export type Provider = {
  id: string
  wallet: string
  categories: string[]
  capabilities: Record<string, unknown>
  createdAt?: string
}

export type Intent = {
  id: string
  category: string
  stakeUSDC?: number
  stakeUsdc?: number
  params?: Record<string, unknown>
  createdAt?: string
  status?: string
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
  health: () => apiGet<any>('/health'),
  providers: () => apiGet<{ providers: Provider[] } | Provider[]>('/api/v1/providers'),
  intents: () => apiGet<{ intents: Intent[] } | Intent[]>('/api/v1/intents'),
  intent: (id: string) => apiGet<any>(`/api/v1/intents/${id}`),
  offers: (intentId: string) => apiGet<any>(`/api/v1/intents/${intentId}/offers`),
  match: (providerId: string) => apiGet<any>(`/api/v1/match/${providerId}`),
}

export function unwrapList<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray(data[key])) return data[key] as T[]
  return []
}
