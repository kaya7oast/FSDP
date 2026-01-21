import { createProxyMiddleware } from "http-proxy-middleware";

export default function routes(app) {
  // Agent Service Routes
  app.use(
    "/agents",
    createProxyMiddleware({
      target: "http://agent-service:4001",
      changeOrigin: true
    })
  );

  // Conversation Service Routes
  app.use(
    "/conversations",
    createProxyMiddleware({
      target: "http://conversation-service:4002",
      changeOrigin: true
    })
  );

  app.use(
    "/ai",
    createProxyMiddleware({
      target: "http://ai-service:4000",
      changeOrigin: true,
      pathRewrite: {
        '^/ai': '', // Removes '/ai' so the service sees '/generate'
      },
    })
  );
  app.use(
    "/users",
    createProxyMiddleware({
      target: "http://user-service:4003",
      changeOrigin: true
    })
  );
  app.use(
    "/ingestion",
    createProxyMiddleware({
      target: "http://ingestion-service:4006",
      changeOrigin: true
    })
  );
  app.use(
    "/retrieval",
    createProxyMiddleware({
      target: "http://retrieval-service:4005",
      changeOrigin: true
    })
  );

}


