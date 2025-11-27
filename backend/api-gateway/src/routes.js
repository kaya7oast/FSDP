import { createProxyMiddleware } from "http-proxy-middleware";

export default function routes(app) {
  // Agent Service Routes
  app.use(
    "/agents",
    createProxyMiddleware({
      target: process.env.AGENT_SERVICE || "http://agent-service:4001",
      changeOrigin: true
    })
  );

  // Conversation Service Routes
  app.use(
    "/conversations",
    createProxyMiddleware({
      target: process.env.CONVERSATION_SERVICE || "http://conversation-service:4002",
      changeOrigin: true
    })
  );

  // --- NEW: AI Service Route ---
  app.use(
    "/ai",
    createProxyMiddleware({
      target: process.env.AI_SERVICE_URL || "http://ai-service:4000",
      changeOrigin: true,
      pathRewrite: {
        '^/ai': '', // This strips '/ai' so the service receives '/generate' instead of '/ai/generate'
      },
    })
  );
}