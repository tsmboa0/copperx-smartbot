import { MessagesAnnotation, Annotation } from "@langchain/langgraph";
import { Context } from "grammy";


export const GraphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    ctx: Annotation<Context>()
});


export const OutputState = Annotation.Root({
    ...MessagesAnnotation.spec
});