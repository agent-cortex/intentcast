/**
 * Test real x402 payment on Base Sepolia
 * 
 * Uses @x402/fetch to automatically handle the 402 payment flow
 */

const PRIVATE_KEY = process.argv[2];
if (!PRIVATE_KEY) {
  console.error("Usage: node test-x402-real.cjs <privateKey>");
  process.exit(1);
}

async function main() {
  // Dynamic imports for ESM modules
  const { wrapFetchWithPayment, x402Client } = await import("@x402/fetch");
  const { ExactEvmScheme, toClientEvmSigner } = await import("@x402/evm");
  const viem = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  
  const pk = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  const account = privateKeyToAccount(pk);
  
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        Real x402 Payment Test - Base Sepolia                 ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("Payer wallet:", account.address);
  console.log("");
  
  // Create x402 client and register the EVM scheme for Base Sepolia
  const network = "eip155:84532";
  const client = new x402Client();
  client.register(network, new ExactEvmScheme(toClientEvmSigner(account)));
  
  // Wrap fetch with x402 payment handling
  const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);
  
  console.log("▶ Calling x402-protected endpoint...");
  console.log("  (This will automatically handle the 402 → payment → retry flow)");
  console.log("");
  
  const url = "https://x402-mock-provider-production.up.railway.app/fulfill";
  const resp = await fetchWithPay(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intentId: "test-" + Date.now(),
      input: { message: "Hello from x402 test!" }
    })
  });
  
  console.log("Response status:", resp.status);
  
  // Check for payment response header
  const paymentResponseHeader = resp.headers.get("PAYMENT-RESPONSE") || resp.headers.get("payment-response");
  if (paymentResponseHeader) {
    const paymentResponse = JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString("utf-8"));
    console.log("");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("✅ REAL USDC PAYMENT SUCCESSFUL!");
    console.log("════════════════════════════════════════════════════════════════");
    console.log("Transaction:", paymentResponse.transaction);
    console.log("Network:", paymentResponse.network);
    console.log("Payer:", paymentResponse.payer);
    console.log("");
    console.log("🔗 BaseScan: https://sepolia.basescan.org/tx/" + paymentResponse.transaction);
    console.log("════════════════════════════════════════════════════════════════");
  }
  
  const data = await resp.json();
  console.log("");
  console.log("Response body:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
