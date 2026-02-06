/**
 * Mock x402 provider for demo purposes
 * Simulates the x402 payment flow without real facilitator
 */
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PROVIDER_WALLET = process.env.PROVIDER_WALLET || "0xe08Ad6b0975222f410Eb2fa0e50c7Ee8FBe78F2D";
const PRICE = "$0.01";
const NETWORK = "eip155:84532";

// Simulate x402 payment response
app.post("/fulfill", async (req, res) => {
  const xPayment = req.headers["x-payment"];
  
  // If no payment header, return 402 with payment requirements
  if (!xPayment) {
    const paymentSpec = {
      accepts: [{
        scheme: "exact",
        network: NETWORK,
        maxAmountRequired: PRICE,
        resource: "/fulfill",
        payTo: PROVIDER_WALLET,
        maxTimeoutSeconds: 300
      }],
      facilitator: "https://facilitator.x402.org",
      version: "1.0"
    };
    
    res.setHeader("X-Payment", Buffer.from(JSON.stringify(paymentSpec)).toString("base64"));
    res.setHeader("Access-Control-Expose-Headers", "X-Payment, X-Payment-Response");
    return res.status(402).json({
      error: "Payment Required",
      message: "x402 payment required to access this resource",
      price: PRICE,
      network: NETWORK,
      payTo: PROVIDER_WALLET
    });
  }
  
  // Payment received - simulate verification and fulfillment
  const { intentId, input } = req.body as { intentId?: string; input?: unknown };
  
  // Simulate a transaction hash (in production, this would be the real payment tx)
  const mockTxHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  
  // Simulate work result
  const preview = typeof input === "string" ? input.substring(0, 50) : JSON.stringify(input || {}).substring(0, 50);
  const result = `✅ Fulfilled intent ${intentId}: "${preview}..."`;
  
  // Return x402 payment response header
  const paymentResponse = {
    success: true,
    txHash: mockTxHash,
    network: NETWORK,
    amount: PRICE
  };
  res.setHeader("X-Payment-Response", Buffer.from(JSON.stringify(paymentResponse)).toString("base64"));
  res.setHeader("Access-Control-Expose-Headers", "X-Payment, X-Payment-Response");
  
  res.json({
    success: true,
    intentId,
    result,
    timestamp: new Date().toISOString(),
    payment: {
      status: "verified",
      txHash: mockTxHash,
      network: NETWORK,
      amount: PRICE,
      payTo: PROVIDER_WALLET
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    x402: true,
    mock: true,
    payTo: PROVIDER_WALLET 
  });
});

// API endpoint for demo
app.get("/api/demo-fulfill", (req, res) => {
  res.json({
    endpoint: "/fulfill",
    method: "POST",
    price: PRICE,
    network: NETWORK,
    payTo: PROVIDER_WALLET,
    example: {
      headers: { "X-Payment": "<base64 payment proof>" },
      body: { intentId: "int_xxx", input: { query: "..." } }
    }
  });
});

const PORT = process.env.PORT || 3002;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Mock x402 provider running on port ${PORT}`);
  console.log(`💰 Payments to: ${PROVIDER_WALLET}`);
  console.log(`📋 Price: ${PRICE} per request`);
  console.log(`🔗 Network: ${NETWORK} (Base Sepolia)`);
});
