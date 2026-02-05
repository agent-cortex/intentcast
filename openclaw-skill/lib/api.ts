/**
 * Discovery Service API Client
 * 
 * Typed client for calling the Intent Discovery Service REST API
 */

// Default service URL (can be overridden via config)
const DEFAULT_SERVICE_URL = 'http://localhost:3000';

interface ApiConfig {
  serviceUrl?: string;
  timeout?: number;
}

interface Intent {
  id: string;
  type: string;
  category: string;
  requirements: Record<string, unknown>;
  maxPriceUsdc: string;
  deadline: string;
  requesterWallet: string;
  stakeTxHash: string;
  stakeVerified: boolean;
  stakeAmount: string;
  status: string;
  acceptedOfferId?: string;
  createdAt: string;
}

interface Provider {
  id: string;
  agentId: string;
  capabilities: string[];
  pricing: Record<string, string>;
  wallet: string;
  status: string;
  registeredAt: string;
  lastSeen: string;
}

interface Offer {
  id: string;
  intentId: string;
  providerId: string;
  priceUsdc: string;
  estimatedDeliveryMinutes?: number;
  message?: string;
  status: string;
  createdAt: string;
}

interface CreateIntentRequest {
  category: string;
  requirements?: Record<string, unknown>;
  maxPriceUsdc: string;
  deadlineHours?: number;
  requesterWallet: string;
  stakeTxHash: string;
  stakeAmount: string;
}

interface CreateProviderRequest {
  agentId: string;
  capabilities: string[];
  pricing: Record<string, string>;
  wallet: string;
}

interface CreateOfferRequest {
  providerId: string;
  priceUsdc: string;
  estimatedDeliveryMinutes?: number;
  message?: string;
}

interface ReleasePaymentRequest {
  intentId: string;
  confirmCompletion?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Discovery Service API Client
 */
export class DiscoveryClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiConfig = {}) {
    this.baseUrl = (config.serviceUrl || DEFAULT_SERVICE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json() as T & { error?: string };
      
      if (!response.ok) {
        return {
          success: false,
          error: (data as { error?: string }).error || `HTTP ${response.status}`,
        };
      }
      
      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string; stats: Record<string, number> }>> {
    return this.fetch('/health');
  }

  // Intent endpoints
  async createIntent(input: CreateIntentRequest): Promise<ApiResponse<Intent>> {
    const result = await this.fetch<{ intent: Intent }>('/api/v1/intents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (result.success && result.data) {
      return { success: true, data: result.data.intent };
    }
    return result as ApiResponse<Intent>;
  }

  async listIntents(status?: string): Promise<ApiResponse<Intent[]>> {
    const query = status ? `?status=${status}` : '';
    const result = await this.fetch<{ intents: Intent[] }>(`/api/v1/intents${query}`);
    if (result.success && result.data) {
      return { success: true, data: result.data.intents };
    }
    return result as ApiResponse<Intent[]>;
  }

  async getIntent(id: string): Promise<ApiResponse<Intent>> {
    const result = await this.fetch<{ intent: Intent }>(`/api/v1/intents/${id}`);
    if (result.success && result.data) {
      return { success: true, data: result.data.intent };
    }
    return result as ApiResponse<Intent>;
  }

  async cancelIntent(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetch(`/api/v1/intents/${id}`, {
      method: 'DELETE',
    });
  }

  // Provider endpoints
  async registerProvider(input: CreateProviderRequest): Promise<ApiResponse<Provider>> {
    const result = await this.fetch<{ provider: Provider }>('/api/v1/providers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (result.success && result.data) {
      return { success: true, data: result.data.provider };
    }
    return result as ApiResponse<Provider>;
  }

  async listProviders(): Promise<ApiResponse<Provider[]>> {
    const result = await this.fetch<{ providers: Provider[] }>('/api/v1/providers');
    if (result.success && result.data) {
      return { success: true, data: result.data.providers };
    }
    return result as ApiResponse<Provider[]>;
  }

  async getMatches(providerId: string): Promise<ApiResponse<Intent[]>> {
    return this.fetch(`/api/v1/match/${providerId}`);
  }

  // Offer endpoints
  async submitOffer(intentId: string, input: CreateOfferRequest): Promise<ApiResponse<Offer>> {
    const result = await this.fetch<{ offer: Offer }>(`/api/v1/intents/${intentId}/offers`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (result.success && result.data) {
      return { success: true, data: result.data.offer };
    }
    return result as ApiResponse<Offer>;
  }

  async listOffers(intentId: string): Promise<ApiResponse<Offer[]>> {
    const result = await this.fetch<{ offers: Offer[] }>(`/api/v1/intents/${intentId}/offers`);
    if (result.success && result.data) {
      return { success: true, data: result.data.offers };
    }
    return result as ApiResponse<Offer[]>;
  }

  async acceptOffer(intentId: string, offerId: string): Promise<ApiResponse<Intent>> {
    const result = await this.fetch<{ intent: Intent }>(`/api/v1/intents/${intentId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    });
    if (result.success && result.data) {
      return { success: true, data: result.data.intent };
    }
    return result as ApiResponse<Intent>;
  }

  // Payment endpoints
  async releasePayment(input: ReleasePaymentRequest): Promise<ApiResponse<{ txHash: string }>> {
    return this.fetch('/api/v1/payments/release', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
}

// Default singleton instance
let defaultClient: DiscoveryClient | null = null;

export function getClient(config?: ApiConfig): DiscoveryClient {
  if (!defaultClient || config) {
    defaultClient = new DiscoveryClient(config);
  }
  return defaultClient;
}

export type {
  Intent,
  Provider,
  Offer,
  CreateIntentRequest,
  CreateProviderRequest,
  CreateOfferRequest,
  ReleasePaymentRequest,
  ApiResponse,
  ApiConfig,
};
