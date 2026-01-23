  import { createProxyMiddleware } from "http-proxy-middleware";

  export default function routes(app) {
  app.use("/agents", createProxyMiddleware({
    target: process.env.AGENT_SERVICE || "http://agent-service:4001",
    changeOrigin: true,
    pathRewrite: { "^/agents": "" }
  }));

  app.use("/conversations", createProxyMiddleware({
    target: process.env.CONVERSATION_SERVICE || "http://conversation-service:4002",
    changeOrigin: true,
    pathRewrite: { "^/conversations": "" }
  }));

  app.use("/ai", createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || "http://ai-service:4000",
    changeOrigin: true,
    pathRewrite: { "^/ai": "" }
  }));

  app.use("/users", createProxyMiddleware({
    target: process.env.USER_SERVICE || "http://user-service:4003",
    changeOrigin: true,
    pathRewrite: { "^/users": "" }
  }));

  app.use("/retrieval", createProxyMiddleware({
    target: process.env.RETRIEVAL_SERVICE || "http://retrieval-service:4005",
    changeOrigin: true,
    pathRewrite: { "^/retrieval": "" }
  }));

  app.use("/ingestion", createProxyMiddleware({
    target: process.env.INGESTION_SERVICE || "http://ingestion-service:4006",
    changeOrigin: true,
    pathRewrite: { "^/ingestion": "" }
  }));
}


