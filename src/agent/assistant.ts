import {ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts";
import {START, END, StateGraph, MemorySaver} from "@langchain/langgraph"
import { GraphState, OutputState } from "./state";
import {ToolNode} from "@langchain/langgraph/prebuilt";
import { apiTools } from "./tools";
import { LLM } from "./model";
import { SystemPrompt } from "./prompt";
import { AIMessage } from "@langchain/core/messages";
import { Context } from "grammy";

//LLM with tools
const LLMWithTools = LLM.bindTools(apiTools);

//define the call model node
const callModel = async(state: typeof GraphState.State)=>{
    console.log("Inside the callModel node");
    const {messages, ctx} = state
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", SystemPrompt],
        new MessagesPlaceholder("msgs")
    ]);
    const chain = prompt.pipe(LLMWithTools)
    const result = await chain.invoke({msgs:messages, ctx:JSON.stringify(ctx), username:ctx.username});

    console.log("The LLM response is: ",result)

    return {messages:[result]}
}

//define the tools node
const tools_node = new ToolNode(apiTools);

//definr checkpoint
// const memory = new MemorySaver(); //We will add persistence after acceptance.

const builder = new StateGraph(GraphState)
.addNode("call_model", callModel)
.addNode("tools", tools_node)
.addEdge(START, "call_model")
.addEdge("call_model", "tools")
.addEdge("tools", END)

 

export const graph = builder.compile()