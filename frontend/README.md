# FSDP
Designing and Implementing Human-Centric Interfaces for  Custom Agent ManagementSystems

## 🧠 API Endpoints Overview

| Endpoint | Method | Description | Request Body Example | Response Example |
|-----------|---------|--------------|----------------------|------------------|
| `/api/agents/:agentId/chat` | **POST** | Sends a message to an AI agent and receives a reply. If conversation exists, continues context. | ```json { "userId": "USER123", "message": "Hi!", "endSession": false } ``` | ```json { "reply": "Hello! I’m Word Master, your helpful assistant." } ``` |
| `/api/conversation/:userId/:agentId/summarize` | **POST** | Summarizes all messages between a user and an agent, then saves summary in DB. | _No body required_ | ```json { "message": "Conversation summarized successfully", "summary": "The user discussed AI abilities and got an explanation." } ``` |
| `/api/agents` | **GET** | Retrieves all agents stored in MongoDB. | – | ```json [ { "_id": "672c1a...", "AgentName": "Word Master", "Specialization": "Language Understanding" } ] ``` |
| `/api/agents` | **POST** | Adds a new agent to the database. | ```json { "AgentID": "A001", "AgentName": "Word Master", "Description": "Helpful assistant", "Specialization": "Language", "Personality": { "Tone": "Friendly" } } ``` | ```json { "_id": "672c1a...", "AgentName": "Word Master", "createdAt": "2025-11-09T07:00:00Z" } ``` |

---

### ⚙️ Notes
- All responses are in **JSON format**.  
- `:agentId` and `:userId` are **dynamic parameters** (replace with actual IDs).  
- Use `endSession: true` in `/api/agents/:agentId/chat` to signal the end of a chat and trigger conversation summarization later.  
- Ensure your `.env` file contains a valid **OpenAI API key** (`OPENAI_API_KEY=`).  
- MongoDB must be connected via your `connectDB()` function.

---


git
