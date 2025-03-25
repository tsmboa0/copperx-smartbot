import { ChatGroq } from "@langchain/groq";
import config from "../config/config";



//define the model.
export const LLM = new ChatGroq({
    model:"llama-3.3-70b-versatile",
    temperature:0,
    apiKey: config.model.api
});