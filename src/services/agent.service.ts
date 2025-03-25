
import { Context } from "grammy";
import { graph } from "../agent/assistant";
import { chain } from "../utils/router";
import { HumanMessage } from "@langchain/core/messages";
import { RouterResponse } from "../utils/types";


class AgentService{
    private static instance: AgentService

    private constructor(){}

    public static getInstance(): AgentService {
        if (!AgentService.instance) {
          AgentService.instance = new AgentService();
        }
        return AgentService.instance;
    }

    public async callAgent(ctx:Context):Promise<void>{
        if(!ctx.from?.id || !ctx.message?.text) return
        const config = {
            configurable:{
                thread_id : ctx.from.id
            }
        }

        const state = {
            messages: [new HumanMessage(ctx.message?.text)],
            ctx:{
                username:ctx.from.first_name,
                userId: ctx.from.id
            }
        }

        console.log("starting to call assitant agent in agent service")

        await graph.invoke(state, config);

        return
    }

    public async router(ctx:Context):Promise<string>{
        const query = ctx.message?.text;

        const res = await chain.invoke({user_message:query});

        console.log("The router response's is: ",res);

        return res;
    }
}

export const agentService = AgentService.getInstance()