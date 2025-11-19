import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGO_URL = process.env.MONGO_URL;

export const saveAgent = async (req, res) => {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    const db = client.db('FSDP');
    const collection = db.collection('agents'); // Use 'agents' collection
    
    const agentData = req.body;
    
    // Add auto-generated fields
    const finalAgentData = {
      ...agentData,
      AgentID: `A${Date.now()}`,
      Version: 'v1.0',
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };
    
    const result = await collection.insertOne(finalAgentData);
    await client.close();
    
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};