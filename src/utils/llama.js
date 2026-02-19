const OpenAI =require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 60000, 
});
 const callLlama = async (messages,options = {}) => {
  try {
    const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.7,
    max_tokens:options.maxTokens || 300
  });

  return response; // return full response
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw new Error("AI response failed");
  }
  
};
module.exports=callLlama;
