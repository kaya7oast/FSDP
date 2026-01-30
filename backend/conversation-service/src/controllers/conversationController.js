import axios from "axios";
import Conversation from "../models/conversationModel.js";


const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // e.g., http://ai-service:4000
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE; // e.g., http://agent-service:4001
const RETRIEVAL_SERVICE_URL = process.env.RETRIEVAL_SERVICE_URL; // http://retrieval-service:4005

// Helper: fetch agent details from agent-service
async function getAgentbyId(agentId) {
  if (!AGENT_SERVICE_URL) return null;
  try {
    const resp = await axios.get(`${AGENT_SERVICE_URL}/${agentId}`);
    return resp.data.agent; // Expected: { agent: { ... } }
  } catch (err) {
    console.error(`Error fetching agent ${agentId}:`, err.message);
    return null;
  }
}


//choose the correct AI providers
function routeLLM({ agent, phase = "analysis" }) {
  // 1. If synthesis phase (final user response), prefer Gemini for speed/smoothness
  // or OpenAI for reliability. 
  if (phase === "synthesis") return "gemini";

  const spec = (agent.Specialization || "").toLowerCase();
  
  // 2. Logic-based routing
  if (spec.includes("code") || spec.includes("developer") || spec.includes("debug")) {
    return "openai"; // GPT-4 is usually best for code
  }
  if (spec.includes("search") || spec.includes("fact") || spec.includes("news")) {
    return "deepseek"; // or whoever is your search specialist
  }
  
  // 3. Fallback to Agent's default or global default
  return agent.LLMProvider || "openai";
}


// Helper: call AI service to generate a response
async function generateAIResponse(provider, messages = []) {
  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL not configured");
  }

  try {
    const resp = await axios.post(`${AI_SERVICE_URL}/generate`, {
      provider,
      messages,
    });

    let rawOutput = "";

    // 1. Extract the raw string from your AI Service response structure
    if (resp.data) {
      if (typeof resp.data.response === "string") rawOutput = resp.data.response;
      else if (typeof resp.data.reply === "string") rawOutput = resp.data.reply;
      else if (typeof resp.data.content === "string") rawOutput = resp.data.content;
      else rawOutput = JSON.stringify(resp.data);
    }

    // 2. CLEAN it using the helper
    // This removes {"final_response": "..."} wrappers
    return cleanLLMResponse(rawOutput);

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
export const chatWithAgent = async (req, res) => {
  const { agentId } = req.params;
  const { 
    userId, 
    message, 
    provider = "gemini", 
    chatname,
    conversationId = null,
    docIds =[]
  } = req.body;

  try {
    const [supervisor, allAgentsResp, retrievedContext] = await Promise.all([
      getAgentbyId(agentId),
      axios.get(`${AGENT_SERVICE_URL}/`).catch(e => ({ data: [] })), 
      docIds.length > 0 
        ? retrieveContext({ userId, docIds, query: message }) 
        : Promise.resolve("")
    ]);

    // Validation checks happen AFTER data arrives
    if (!supervisor) {
      console.error("Agent not found in Agent Service");
      return res.status(404).json({ error: "Agent not found" });
    }

    // Process Agent Catalog
    const rawAgents = Array.isArray(allAgentsResp.data) 
      ? allAgentsResp.data 
      : (allAgentsResp.data.agents || []);

    const supervisorIdStr = String(supervisor._id || supervisor.AgentID);
    const agentCatalog = rawAgents.filter(
      a => String(a._id || a.AgentID) !== supervisorIdStr
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
      console.log("[OPTIMIZATION] Short-circuiting: Supervisor handling directly.");
      const directMessages = [
        { role: "system", content: systemMessage },
        ...(retrievedContext ? [{ role: "system", content: `CONTEXT:\n${retrievedContext}` }] : []),
        ...conversation.messages.filter(m => m.role !== "system").slice(-8)
      ];

      // Fast route check (logic-based)
      const directProvider = routeLLM({ agent: supervisor, phase: "synthesis" });
      
      const directReply = await generateAIResponse(directProvider, directMessages);

      const replyObj = {
        role: "assistant",
        agentId: supervisor._id,
        content: directReply,
        visibility: "user",
        createdAt: new Date().toISOString(),
      };

      conversation.messages.push(replyObj);
      await conversation.save();

      return res.json({ 
        reply: replyObj,
        conversationId: conversation.conversationId 
      });
    }
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
    
    // Only send last 10 messages to AI
    const messagesToSend = [
      { role: "system", content: systemMessage },

      ...(retrievedContext
        ? [{
            role: "system",
            content: `Use the following context to answer the user's question. If the answer is not in the context, say you are unsure.\n\n${retrievedContext} & use online information`
          }]
        : []),

      ...conversation.messages
        .filter(m => m.role !== "system")
        .slice(-8)
    ];
    
    // -----------------------------
    // 4. Get AI response
    // -----------------------------
    // Sub-agent analysis loop
    const internalResults = await Promise.all(
      activeSubAgents.map(async (subAgent) => {

        const subPrompt = buildAgentSystemPrompt(subAgent, message);

        const chosenProvider = routeLLM({ agent: subAgent });
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

    const supervisorProvider = routeLLM({ agent: supervisor, phase: "synthesis" });
    
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
    
    // Save conversation
    await conversation.save();

    // Return only user-visible content to the client
    res.json({ 
      reply: {
        role: "assistant",
        content: replyText,
        visibility: "user"
      },
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
  console.log("getConversation called with ID:", conversationId);
  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    
    // Ensure authenticated user can only access their own conversation
    if (conversation.userId !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized: Cannot access other users' conversations" });
    }
    
    if (conversation.status === "deleted") return res.status(410).json({ error: "Conversation deleted" });
    
    // Filter out system prompts and internal messages before sending to client
    const filteredConversation = {
      ...conversation.toObject(),
      messages: conversation.messages.filter(m => 
        m.role !== "system" && m.visibility === "user"
      )
    };
    
    res.json(filteredConversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all conversations for a user
export const getAllConversations = async (req, res) => {
  const { userId } = req.params;
  
  // Ensure authenticated user can only access their own conversations
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: "Unauthorized: Cannot access other users' conversations" });
  }
  
  try {
    const conversations = await Conversation.find({ userId, status: "active" });
    
    // Filter out system prompts and internal messages before sending to client
    const filteredConversations = conversations.map(conv => ({
      ...conv.toObject(),
      messages: conv.messages.filter(m => 
        m.role !== "system" && m.visibility === "user"
      )
    }));
    
    res.json(filteredConversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Delete conversation
export const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOne({ conversationId });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });
    
    // Ensure authenticated user can only delete their own conversation
    if (conversation.userId !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized: Cannot delete other users' conversations" });
    }
    
    await Conversation.findOneAndUpdate(
      { conversationId },
      { status: "deleted" },
      { new: true }
    );
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
    
    // Ensure authenticated user can only summarize their own conversation
    if (conversation.userId !== req.user.userId) {
      return res.status(403).json({ error: "Unauthorized: Cannot summarize other users' conversations" });
    }

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




async function retrieveContext({ userId, docIds, query }) {
  console.log("retrieveContext called with:", { userId, docIds, query });
  try {
    const resp = await axios.post(
      `${process.env.RETRIEVAL_SERVICE_URL}/retrieve`,
      {
        userId,
        docIds,
        query,
        topK: 5
      }
    );

    const chunks = resp.data || [];

    console.log("retrieval raw chunks:", chunks);

    // 🔥 Convert array → text
    return chunks
      .map(
        (c, i) =>
          `(${i + 1}) [score: ${c.score.toFixed(2)}]\n${c.text}`
      )
      .join("\n\n");

  } catch (err) {
    console.error(
      "retrieveContext error:",
      err?.response?.data || err.message
    );
    return "";
  }
}

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

CRITICAL SELECTION RULES:
1. **MULTI-AGENT COLLABORATION IS REQUIRED**: You MUST select at least 2 agents to ensure diverse perspectives and error checking.
2. **Strategy**:
   - Pick a PRIMARY specialist to handle the main task.
   - Pick a SECONDARY specialist to provide context, review, alternative viewpoints, or fact-checking.
   - Example: For code, pick "Developer" AND "Security" or "Quality Assurance".
   - Example: For writing, pick "Writer" AND "Editor" or "Fact Checker".

OUTPUT RULES:
- Return ONLY agent IDs.
- Comma-separated (e.g., ID1, ID2).
- Do NOT provide explanations.
- Select between 2 and 4 agents.
`;

  const decision = await generateAIResponse("openai", [ // Use a smart model (GPT-4) for routing
    { role: "system", content: prompt },
  ]);

  // Clean the response
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

// --- NEW HELPER: Cleans AI output to ensure plain text ---
function cleanLLMResponse(responseText) {
  if (!responseText) return "";
  if (typeof responseText !== "string") return JSON.stringify(responseText);

  // 1. Remove Markdown code blocks (e.g. ```json ... ```)
  let cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
  cleanText = cleanText.replace(/```\n?|\n?```/g, "").trim();

  if (cleanText.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleanText);
      return parsed.final_response || parsed.reply || parsed.content || parsed.message || parsed.answer || cleanText;
    } catch (e) {
      return cleanText;
    }
  }
  return cleanText;
}