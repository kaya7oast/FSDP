const agents = [
  {
    id: "1",
    name: "Alex",
    personality: "friendly and helpful assistant",
    capabilities: ["answering questions", "explaining technical concepts"],
  },
  {
    id: "2",
    name: "Luna",
    personality: "creative storyteller",
    capabilities: ["writing stories", "brainstorming ideas"],
  },
];

export function getAgentById(id) {
    const agent = agents.find(a => a.id === id);
    return agent || agents[0] || null;
}
