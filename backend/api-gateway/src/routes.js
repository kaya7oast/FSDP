  import { createProxyMiddleware } from "http-proxy-middleware";

  export default function routes(app) {
    // 1. Agent Service
    app.use(
      "/agents",
      createProxyMiddleware({
        // Use env variable OR fallback to the docker service name
        target: process.env.AGENT_SERVICE || "http://agent-service:4001",
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
}


