import { ChatGroq } from "@langchain/groq";

export const model = new ChatGroq({
  model: "llama-3.3-70b-versatile", // ✅ updated
  temperature: 0.7,
  apiKey: process.env["GROQ_API_KEY"],
});

export const filterExtractionModel = new ChatGroq({
  model: "llama-3.3-70b-versatile", // ✅ updated
  temperature: 0,
  apiKey: process.env["GROQ_API_KEY"],
});