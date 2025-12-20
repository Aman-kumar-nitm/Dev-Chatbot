const OpenAI =require("openai");

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 60000, 
});
 const callLlama = async (messages) => {
  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.7,
    max_tokens: 1024
  });

  return response; // return full response
};
module.exports=callLlama;
