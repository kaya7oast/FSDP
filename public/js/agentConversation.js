import Conversation from "./agentDB/models/conversationModel.js"; 

export const chatWithAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId, message } = req.body;

    let conversation = await Conversation.findOne({ userId, agentId });

    if (!conversation) {
      conversation = new Conversation({
        conversationId: Date.now().toString(),
        userId,
        agentId,
        messages: []
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message
    });

    // Simulate agent response
    conversation.messages.push({
      role: "assistant",
      content: "I'm processing your request."
    });

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backend error" });
  }
};
