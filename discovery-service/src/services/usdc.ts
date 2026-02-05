/**
 * USDC Service — Base Sepolia integration via ethers.js v6
 * 
 * Functions:
 * - getBalance(wallet): Get USDC balance
 * - verifyStake(wallet, minAmount): Check if wallet has sufficient USDC
 * - verifyTransfer(txHash, from, to, expectedAmount): Verify a USDC transfer
 * - executeTransfer(to, amount, privateKey): Execute a USDC transfer
 */

import { ethers } from 'ethers';

// Base Sepolia configuration
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const USDC_ADDRESS = process.env.USDC_CONTRACT || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_DECIMALS = 6;

// USDC ERC20 ABI (minimal)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// Create provider
const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);

// Create read-only USDC contract instance
const usdcRead = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

/**
 * Get USDC balance for a wallet address
 */
export async function getBalance(wallet: string): Promise<string> {
  try {
    const balance = await usdcRead.balanceOf(wallet);
    return ethers.formatUnits(balance, USDC_DECIMALS);
  } catch (error) {
    console.error('getBalance error:', error);
    throw new Error(`Failed to get balance: ${(error as Error).message}`);
  }
}

/**
 * Verify wallet has at least minAmount USDC
 */
export async function verifyStake(wallet: string, minAmount: string): Promise<boolean> {
  try {
    const balance = await getBalance(wallet);
    const hasEnough = parseFloat(balance) >= parseFloat(minAmount);
    console.log(`verifyStake: ${wallet} has ${balance} USDC, needs ${minAmount} → ${hasEnough}`);
    return hasEnough;
  } catch (error) {
    console.error('verifyStake error:', error);
    return false; // Fail closed for safety
  }
}

/**
 * Verify a USDC transfer transaction
 */
export async function verifyTransfer(
  txHash: string,
  from: string,
  to: string,
  expectedAmount: string
): Promise<{ verified: boolean; actualAmount?: string; error?: string }> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { verified: false, error: 'Transaction not found' };
    }
    
    if (receipt.status !== 1) {
      return { verified: false, error: 'Transaction failed' };
    }
    
    // Parse Transfer events
    const iface = new ethers.Interface(USDC_ABI);
    
    for (const log of receipt.logs) {
      // Only check USDC contract logs
      if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) continue;
      
      try {
        const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
        
        if (parsed?.name === 'Transfer') {
          const logFrom = (parsed.args[0] as string).toLowerCase();
          const logTo = (parsed.args[1] as string).toLowerCase();
          const amount = ethers.formatUnits(parsed.args[2], USDC_DECIMALS);
          
          // Check if this matches our expected transfer
          if (
            logFrom === from.toLowerCase() &&
            logTo === to.toLowerCase() &&
            parseFloat(amount) >= parseFloat(expectedAmount)
          ) {
            console.log(`verifyTransfer: Confirmed ${amount} USDC from ${from} to ${to}`);
            return { verified: true, actualAmount: amount };
          }
        }
      } catch {
        // Not a parseable Transfer event, skip
        continue;
      }
    }
    
    return { verified: false, error: 'No matching Transfer event found' };
  } catch (error) {
    console.error('verifyTransfer error:', error);
    return { verified: false, error: (error as Error).message };
  }
}

/**
 * Execute a USDC transfer (for payment release)
 */
export async function executeTransfer(
  to: string,
  amount: string,
  privateKey: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create USDC contract with signer
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
    
    // Parse amount to wei (6 decimals for USDC)
    const amountWei = ethers.parseUnits(amount, USDC_DECIMALS);
    
    // Check balance first
    const balance = await usdc.balanceOf(wallet.address);
    if (balance < amountWei) {
      return {
        success: false,
        error: `Insufficient balance: have ${ethers.formatUnits(balance, USDC_DECIMALS)}, need ${amount}`,
      };
    }
    
    console.log(`executeTransfer: Sending ${amount} USDC to ${to}...`);
    
    // Execute transfer
    const tx = await usdc.transfer(to, amountWei);
    console.log(`executeTransfer: TX submitted: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log(`executeTransfer: Confirmed in block ${receipt.blockNumber}`);
      return { success: true, txHash: receipt.hash };
    } else {
      return { success: false, error: 'Transaction reverted' };
    }
  } catch (error) {
    console.error('executeTransfer error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get the wallet address from a private key
 */
export function getWalletAddress(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Service config for health checks
 */
export function getUsdcConfig() {
  return {
    rpc: BASE_SEPOLIA_RPC,
    usdcContract: USDC_ADDRESS,
    network: 'base-sepolia',
  };
}
