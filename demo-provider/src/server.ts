import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const facilitator = new HTTPFacilitatorClient({
  url: "https://facilitator.x402.org",
});

const server = new x402ResourceServer(facilitator).register(
  "eip155:84532",
  new ExactEvmScheme(),
);

// x402 protected endpoint
app.use(
  paymentMiddleware(
    {
      "POST /fulfill": {
        accepts: {
          scheme: "exact",
          price: "$0.01", // 1 cent per request for demo
          network: "eip155:84532",
          payTo: process.env.PROVIDER_WALLET!,
        },
        description: "Demo IntentCast fulfillment",
      },
    },
    server,
  ),
);

app.post("/fulfill", async (req, res) => {
  const { intentId, input } = req.body as {
    intentId?: string;
    input?: string;
  };

  // Simulate work (e.g., text summarization)
  const preview = typeof input === "string" ? input.substring(0, 50) : "";
  const result = `Processed intent ${intentId}: "${preview}..."`;

  res.json({
    success: true,
    intentId,
    result,
    timestamp: new Date().toISOString(),
  });
});

// Health check (free)
app.get("/health", (req, res) => {
  res.json({ status: "ok", x402: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Demo provider running on port ${PORT}`);
  console.log(`x402 payments to: ${process.env.PROVIDER_WALLET}`);
});
