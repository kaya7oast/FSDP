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

    // 2. Conversation Service
    app.use(
      "/conversations",
      createProxyMiddleware({
        target: process.env.CONVERSATION_SERVICE || "http://conversation-service:4002",
        changeOrigin: true
      })
    );

    // 3. AI Service (The "Brain" for Voice Assistant)
    app.use(
      "/api/ai/system", 
      createProxyMiddleware({
        // Note: docker-compose says ai-service is on Port 4000
        target: process.env.AI_SERVICE_URL || "http://ai-service:4000",
        changeOrigin: true,
        pathRewrite: {
          '^/api/ai/system': '/generate', // Rewrites the path for the AI service
        },
      })
    );
  }