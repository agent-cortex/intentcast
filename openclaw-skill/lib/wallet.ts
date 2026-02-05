/**
 * USDC Wallet Operations
 * 
 * Client-side wallet operations for the OpenClaw skill.
 * Handles staking USDC and releasing payments on Base Sepolia.
 */

import { ethers } from 'ethers';

// Base Sepolia configuration
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_DECIMALS = 6;

// USDC ERC20 ABI (minimal)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

interface WalletConfig {
  privateKey: string;
  rpcUrl?: string;
}

interface TransferResult {
  success: boolean;
  txHash?: string;
  wallet?: string;
  error?: string;
}

interface BalanceResult {
  success: boolean;
  balance?: string;
  error?: string;
}

/**
 * USDC Wallet Manager
 */
export class UsdcWallet {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private usdc: ethers.Contract;

  constructor(config: WalletConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl || BASE_SEPOLIA_RPC);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    this.usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, this.wallet);
  }

  get address(): string {
    return this.wallet.address;
  }

  /**
   * Get USDC balance
   */
  async getBalance(): Promise<BalanceResult> {
    try {
      const balance = await this.usdc.balanceOf(this.wallet.address);
      return {
        success: true,
        balance: ethers.formatUnits(balance, USDC_DECIMALS),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get ETH balance (for gas)
   */
  async getEthBalance(): Promise<BalanceResult> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return {
        success: true,
        balance: ethers.formatEther(balance),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Stake USDC (transfer to escrow/service wallet)
   */
  async stakeUsdc(amount: string, escrowWallet: string): Promise<TransferResult> {
    try {
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      
      // Check balance first
      const balance = await this.usdc.balanceOf(this.wallet.address);
      if (balance < amountWei) {
        return {
          success: false,
          error: `Insufficient USDC: have ${ethers.formatUnits(balance, USDC_DECIMALS)}, need ${amount}`,
        };
      }
      
      console.log(`Staking ${amount} USDC to ${escrowWallet}...`);
      
      // Execute transfer
      const tx = await this.usdc.transfer(escrowWallet, amountWei);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        return {
          success: true,
          txHash: receipt.hash,
          wallet: this.wallet.address,
        };
      } else {
        return {
          success: false,
          error: 'Transaction reverted',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Transfer USDC to another address
   */
  async transfer(to: string, amount: string): Promise<TransferResult> {
    try {
      const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
      
      // Check balance first
      const balance = await this.usdc.balanceOf(this.wallet.address);
      if (balance < amountWei) {
        return {
          success: false,
          error: `Insufficient USDC: have ${ethers.formatUnits(balance, USDC_DECIMALS)}, need ${amount}`,
        };
      }
      
      console.log(`Transferring ${amount} USDC to ${to}...`);
      
      // Execute transfer
      const tx = await this.usdc.transfer(to, amountWei);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        return {
          success: true,
          txHash: receipt.hash,
          wallet: this.wallet.address,
        };
      } else {
        return {
          success: false,
          error: 'Transaction reverted',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Create wallet from private key
 */
export function createWallet(privateKey: string, rpcUrl?: string): UsdcWallet {
  return new UsdcWallet({ privateKey, rpcUrl });
}

/**
 * Get wallet address from private key (without connecting)
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format USDC amount for display
 */
export function formatUsdc(amount: string, decimals: number = 2): string {
  const num = parseFloat(amount);
  return num.toFixed(decimals) + ' USDC';
}

export type { WalletConfig, TransferResult, BalanceResult };
