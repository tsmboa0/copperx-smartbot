import { MessagesAnnotation, Annotation } from "@langchain/langgraph";

export interface UserContext{
    username:string,
    userId:number
}

export const GraphState = Annotation.Root({
    ...MessagesAnnotation.spec,
    ctx: Annotation<UserContext>()
});


export const OutputState = Annotation.Root({
    ...MessagesAnnotation.spec
});