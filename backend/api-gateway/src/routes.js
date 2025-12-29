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

  
}


