import axios from "axios";
import Conversation from "../models/conversationModel.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // e.g., http://ai-service:4000
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE; // e.g., http://agent-service:4001

// Helper: fetch agent details from agent-service
async function getAgentbyId(agentId) {
  if (!AGENT_SERVICE_URL) return null;
  try {
    const resp = await axios.get(`${AGENT_SERVICE_URL}/agents/${agentId}`);
    return resp.data; // Expected: { agent: { ... } }
  } catch (err) {
    console.error(`Error fetching agent ${agentId}:`, err.message);
    return null;
  }
}
//choose the correct AI providers
async function routeLLM({ agent, userMessage, phase = "analysis" }) {
  const routerProvider = "openai";

  const routingPrompt = `
You are an LLM routing controller.

Your job is to choose the BEST language model provider
for the CURRENT agent and task phase.

PHASE:
${phase}
(analysis = internal reasoning, research, critique)
(synthesis = final user-facing response)

AGENT ROLE:
${agent.Specialization}

AGENT MISSION:
${agent.Description}

USER MESSAGE:
"${userMessage}"

Available providers:
- openai → best for coding, logic, debugging
- gemini → best for deep reasoning, explanations
- perplexity → best for writing, tone, creativity
- deepseek → best for factual lookup, search-heavy tasks

RULES:
- Choose ONLY ONE provider
- Prefer DIFFERENT providers across agents when appropriate
- Return ONLY one word

Answer with exactly one of:
openai | gemini | perplexity | deepseek
`;

  try {
    const decision = await generateAIResponse(routerProvider, [
      { role: "system", content: routingPrompt },
    ]);

    const provider = decision.trim().toLowerCase();

    if (["openai", "gemini", "perplexity", "deepseek"].includes(provider)) {
      console.log(
    `[LLM ROUTER] agent="${agent.AgentName}" phase="${phase}" → provider="${provider}"`
  ); //remove when done
      return provider;
    }
  } catch (e) {
    console.warn("LLM routing failed, fallback used:", e.message);
  }

  return agent?.LLMProvider || "openai";
}


// Helper: call AI service to generate a response
async function generateAIResponse(provider , messages = []) {
  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL not configured");
  }

  try {
    const resp = await axios.post(`${AI_SERVICE_URL}/generate`, {
      provider,
      messages,
    });

    // ai-service returns { response: '...' } (or similar). Try common shapes.
    if (resp.data) {
      if (typeof resp.data.response === "string") return resp.data.response;
      if (typeof resp.data.reply === "string") return resp.data.reply;
      // fallback: stringify useful parts
      return JSON.stringify(resp.data);
    }

    return "";
  } catch (err) {
    console.error("generateAIResponse error:", err?.response?.data || err.message || err);
    throw err;
  }
}

// Generate a conversation ID
function generateConversationId(userId, agentID) {
  const randomPart = Math.random().toString(10).substring(2, 7).toUpperCase();
  return `${userId}CONVO${agentID}-${randomPart}`;
}

// Chat with agent
// Chat with agent
export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { 
    userId, 
    message, 
    provider = "gemini", 
    chatname,
    conversationId = null 
  } = req.body;

  try {
    const agentResponse = await getAgentbyId(agentId);
    
    // SAFETY CHECK 1
    if (!agentResponse || !agentResponse.agent) {
      console.error("Agent not found in Agent Service");
      return res.status(404).json({ error: "Agent not found" });
    }

    const supervisor = agentResponse.agent;

    // 🗂 Load ALL agents as a catalog (excluding supervisor)
    const allAgentsResp = await axios.get(`${AGENT_SERVICE_URL}/agents`);

    // 🛠️ FIX: Handle if API returns raw array OR object wrapper
    const rawAgents = Array.isArray(allAgentsResp.data) 
      ? allAgentsResp.data 
      : (allAgentsResp.data.agents || []);

    const agentCatalog = rawAgents.filter(
      a => String(a._id) !== String(supervisor._id)
    );

    // 🧠 Supervisor selects relevant sub-agents dynamically
    const selectedAgentIds = await supervisorSelectAgents({
      supervisor,
      agents: agentCatalog,
      userMessage: message,
    });
    
    // 🎯 Build active sub-agent list
    const activeSubAgents = agentCatalog.filter(agent =>
      selectedAgentIds.includes(String(agent._id))
    );

    if (activeSubAgents.length === 0) {
      console.warn(
        "[AGENT ROUTER] No agents selected — supervisor handling alone"
      );
    } else {
      // 🪵 Debug log
      console.log(
        "[AGENT ROUTER] Active sub-agents:",
        activeSubAgents.map(a => a.AgentName)
      );
    }

    // 🛟 Safety fallback (Simple keyword match if LLM failed to pick agents)
    if (activeSubAgents.length === 0) {
       // Optional: Add basic keyword matching here if you want a backup
    }

    const personality = supervisor.Personality || {};
    const tone = personality.Tone || "helpful";
    const style = personality.LanguageStyle || "concise";
    const emotion = personality.Emotion || "neutral";

    const capabilities = Array.isArray(supervisor.Capabilities) 
      ? supervisor.Capabilities.join(", ") 
      : (supervisor.Capabilities || "General Assistance");

    const systemMessage = `
      You are ${supervisor.AgentName || "an AI Assistant"}.
      YOUR IDENTITY:
      - Role: ${supervisor.Specialization || "Assistant"}
      - Mission: ${supervisor.Description || "Help the user."}
      - Capabilities: ${capabilities}
    
      YOUR PERSONALITY:
      - Tone: ${tone}
      - Style: ${style}
      - Attitude: ${emotion}
s
      INSTRUCTIONS:
      Stay in character. Use your specific capabilities to help the user. 
      If asked what you can do, list your specific capabilities.
    `;

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({ conversationId });
    }

    // Fallback: Check if we have an existing convo for this user/agent
    if (!conversation) {
      conversation = await Conversation.findOne({ userId, agentId });
    }

    if (!conversation) {
      const newConversationId = generateConversationId(userId, agentId);

      conversation = new Conversation({
        conversationId: newConversationId,
        userId,
        agentId,
        provider,
        chatname: chatname || `Chat with ${supervisor.AgentName || "Agent"}`,
        messages: [
          {
            role: "system",
            content: systemMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      visibility: "user",
      createdAt: new Date().toISOString(),
    });

    // Sub-agent analysis loop
    const internalResults = await Promise.all(
      activeSubAgents.map(async (subAgent) => {

        const subPrompt = buildAgentSystemPrompt(subAgent, message);

        const chosenProvider = await routeLLM({
          agent: subAgent,
          userMessage: message,
        });

        console.log(
          `[SUB-AGENT] ${subAgent.AgentName} using provider="${chosenProvider}"`
        );

        const contextMessages = getConversationContext(conversation, 6);

        const subReply = await generateAIResponse(chosenProvider, [ 
          { role: "system", content: subPrompt },
          ...contextMessages,
          { role: "user", content: message },
        ]);

        conversation.messages.push({
          role: "assistant",
          agentId: subAgent._id,
          content: subReply,
          visibility: "internal",
          createdAt: new Date().toISOString(),
        });

        return {
          name: subAgent.AgentName,
          reply: subReply,
        };
      })
    );
    
    // Supervisor Synthesis
    const supervisorPrompt = buildSupervisorPrompt(
      supervisor,
      activeSubAgents
    );

    const contextMessages = getConversationContext(conversation, 12);

    const supervisorMessages = [
      { role: "system", content: supervisorPrompt },
      ...contextMessages,
      {
        role: "system",
        content: `INTERNAL ANALYSES (do not expose):\n\n${internalResults
          .map(r => `${r.name}:\n${r.reply}`)
          .join("\n\n")}`,
      },
      { role: "user", content: message },
    ];

    const supervisorProvider = await routeLLM({
      agent: supervisor,
      userMessage: message,
      phase: "synthesis",
    });

    console.log(
      `[SUPERVISOR] ${supervisor.AgentName} using provider="${supervisorProvider}"`
    );

    const replyText = await generateAIResponse(supervisorProvider, supervisorMessages);

    const reply = {
        role: "assistant",
        agentId: supervisor._id,
        content: replyText,
        visibility: "user",
        createdAt: new Date().toISOString(),
    };

    conversation.messages.push(reply);
    if (conversation.messages.length > 20) {
      const summary = await generateAIResponse("openai", [
    {
      role: "system",
      content: "Summarize the following conversation for long-term memory. Capture goals, decisions, and important context."
    },
    ...conversation.messages
      .filter(m => m.visibility === "user")
      .map(m => ({
        role: m.role,
        content: m.content
      }))
    ]);

    conversation.latestSummary = summary;

  // prepend summary as system memory
    conversation.messages.unshift({
      role: "system",
        content: `CONVERSATION SUMMARY:\n${summary}`,
        visibility: "user",
        createdAt: new Date().toISOString()
      });

      // keep token window small
      conversation.messages = conversation.messages.slice(0, 25);
    }
    await conversation.save();

    res.json({ 
      reply, 
      conversationId: conversation.conversationId 
    });
    
  } catch (err) { 
    console.error(
      "ERROR SOURCE:",
      err?.response?.status,
      err?.response?.data,
      err.message
    );
    console.error("chatWithAgent Critical Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// Get conversation
export const getConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    if (conversation.status === "deleted") return res.status(410).json({ error: "Conversation deleted" });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all conversations for a user
export const getAllConversations = async (req, res) => {
  const { userId } = req.params;
  try {
    const conversations = await Conversation.find({ userId, status: "active" });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Delete conversation
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      { status: "deleted" },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    res.json({ message: "Conversation deleted", conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Summarize conversation
export const summarizeConversation = async (req, res) => {
  const { conversationId } = req.params;
  const { provider = "openai" } = req.body;

  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
      provider,
      messages: [
        { role: "system", content: "Summarize the following conversation concisely." },
        ...conversation.messages,
      ],
    });

    const summary = aiResponse.data.response || "No summary available";

    conversation.latestSummary = summary;
    await conversation.save();

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const allConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({});
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function buildAgentSystemPrompt(agent, userMessage) {
  const p = agent.Personality || {};
  return `
You are ${agent.AgentName}.

Role: ${agent.Specialization}
Mission: ${agent.Description}

Your task:
Analyze the user's message from YOUR perspective only.
Do NOT answer the user directly.
Provide insights, facts, risks, or recommendations
that help a supervisor agent craft a final response.

User message:
"${userMessage}"

Tone: ${p.Tone || "helpful"}
Style: ${p.LanguageStyle || "concise"}

Return only your analysis.
`;
}

function buildSupervisorPrompt(supervisor, subAgents) {
  const p = supervisor.Personality || {};

  return `
You are ${supervisor.AgentName}, the SUPERVISOR agent.

ROLE:
You are the single point of communication with the user.
You coordinate multiple internal specialist agents and synthesize
their insights into ONE final, high-quality response.

OBJECTIVE:
- Fully understand the user's request
- Evaluate all sub-agent analyses
- Resolve disagreements between sub-agents
- Select the most accurate and useful information
- Produce a clear, confident, and complete final answer

SUB-AGENT POLICY:
- Sub-agents are INTERNAL specialists
- Their outputs may overlap or conflict
- You must judge correctness and relevance
- You must NOT quote or name sub-agents

AVAILABLE SUB-AGENTS:
${subAgents.map(a => `- ${a.AgentName}: ${a.Specialization}`).join("\n")}

COMMUNICATION RULES:
- Do NOT mention sub-agents or internal steps
- Do NOT expose analysis, chain-of-thought, or deliberation
- Do NOT copy raw sub-agent responses
- Speak directly and naturally to the user

PERSONALITY GUIDELINES:
- Tone: ${p.Tone || "helpful"}
- Style: ${p.LanguageStyle || "concise"}
- Attitude: ${p.Emotion || "neutral"}

CONVERSATION CONTINUITY:
- Remember prior user preferences
- Do not repeat explanations unnecessarily
- Refer naturally to earlier points when relevant
- Ask clarifying questions only when neededS

FINAL OUTPUT REQUIREMENTS:
- Provide a single, coherent response
- Be decisive and authoritative
- Optimize for correctness, clarity, and usefulness
`;
}

async function supervisorSelectAgents({ supervisor, agents, userMessage }) {
  const prompt = `
You are ${supervisor.AgentName}, acting as a supervisor.

User request:
"${userMessage}"

Available specialist agents:
${agents.map(
  a => `ID: ${a._id}
Name: ${a.AgentName}
Specialization: ${a.Specialization}
Description: ${a.Description}`
).join("\n\n")}

RULES:
- Select ONLY agents relevant to the request
- Choose 1–3 agents max
- Return ONLY agent IDs
- Comma-separated
- No explanation
`;

  const decision = await generateAIResponse("openai", [
  { role: "system", content: prompt },
]);

// Clean the response: remove quotes, backticks, or "ID:" prefixes if the LLM hallucinated them
return decision
  .split(",")
  .map(id => id.trim().replace(/['"`]|ID:\s*/g, "")) 
  .filter(Boolean);
}

function getConversationContext(conversation, limit = 12) {
  if (!conversation || !conversation.messages) return [];

  return conversation.messages
    .filter(m => m.visibility === "user") // only user-visible context
    .slice(-limit)
    .map(m => ({
      role: m.role,
      content: m.content,
    }));
}