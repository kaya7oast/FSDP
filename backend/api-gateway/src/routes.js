  import { createProxyMiddleware } from "http-proxy-middleware";

  export default function routes(app) {
    // 1. Agent Service
    app.use(
      "/agents",
      createProxyMiddleware({
        // Use env variable OR fallback to the docker service name
        target: process.env.AGENT_SERVICE || "http://agent-service:4001",
        changeOrigin: true,
        pathRewrite: {
        '^/agents': '',
        },
      })
    );

  // Conversation Service Routes
  app.use(
    "/conversations",
    createProxyMiddleware({
      target: "http://conversation-service:4002",
      changeOrigin: true,
      pathRewrite: {
        '^/conversations': '', 
      },
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
  "/api/ai/system",
  createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || "http://ai-service:4000",
    changeOrigin: true,
    pathRewrite: { '^/api/ai/system': '/generate' },
  })
);

  app.use(
    "/users",
    createProxyMiddleware({
      target: "http://user-service:4003",
      changeOrigin: true,
      pathRewrite: {
        '^/users': '', // Removes '/users' so the service sees '/register'
      },
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


