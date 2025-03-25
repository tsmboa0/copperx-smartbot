import { StringOutputParser } from "@langchain/core/output_parsers";
import { routerPrompt } from "../agent/prompt";
import { LLM } from "../agent/model";
import { ChatPromptTemplate } from "@langchain/core/prompts";


const prompt = ChatPromptTemplate.fromTemplate(routerPrompt);
export const chain = prompt.pipe(LLM).pipe(new StringOutputParser());

