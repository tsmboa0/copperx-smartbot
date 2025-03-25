import { tool, } from "@langchain/core/tools";
import { authHandler } from "../handlers/auth.handler";
import { walletHandler } from "../handlers/wallet.handler";
import { transferHandler } from "../handlers/transfer.handler";
import {z} from "zod";
import bot from "..";
import { getContext } from "../utils/store";
import { UserContext } from "./state";


const sendMessage = tool(
    async({ctx, message})=>{
        console.log("inside send message tool. The message is: ",message," the ctx is: ",ctx)
        try{
            if(!ctx.userId) return;

            await bot.api.sendMessage(ctx.userId, message, {parse_mode:"Markdown"})
            console.log("message sent")
        }catch(e){
            console.log("err sending message: ",e)
        }
    },
    {
        name:"Send Message to User",
        description:"This tool is used for sending message to the user on telegram",
        schema: z.object({
            message: z.string().describe("This is the message to be sent to the user on telegram. It should use good emojis and properly formatted"),
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
)

const Login = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await authHandler.handleLogin(newCtx);
    },
    {
        name:"Login",
        description:"This tool is used for logging the user into their copperx account",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const viewProfile = tool(
    async({ctx})=>{
        console.log("inside view profile");
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        try{
            await authHandler.handleProfile(newCtx);
            console.log("viewing profile....");
        }catch(e){
            console.log("error calling this service: ",e)
        }
    },
    {
        name:"View Profile",
        description:"This tool is used for fetching and displaying the user's profile",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const viewKYCStatus = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await authHandler.handleKYCStatus(newCtx);
    },
    {
        name:"View KYC status",
        description:"This tool is used for fetching and displaying the user's KYC status",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const Logout = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await authHandler.handleLogout(newCtx);
    },
    {
        name:"Logout",
        description:"This tool is used for logging out of their copperx account",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const wallets = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await walletHandler.handleWallets(newCtx);
    },
    {
        name:"View Wallets",
        description:"This tool is used for fetching and displaying all the user's wallet",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const balances = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await walletHandler.handleBalances(newCtx);
    },
    {
        name:"View Wallets Balances",
        description:"This tool is used for fetching and displaying all the user's wallet balances",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const setDefault = tool(
    async({ctx, walletId})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await walletHandler.handleSetDefault(newCtx, walletId);
    },
    {
        name:"Set Default Wallet",
        description:"This tool is used for setting a new default wallet for the user's acount",
        schema: z.object({
            walletId: z.string().describe("This is the wallet id to be set as default"),
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const deposit = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await walletHandler.handleDeposit(newCtx);
    },
    {
        name:"Deposit Guide",
        description:"This tool is used for proiding guidiance to the user on how to deposit to their account",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const transactions = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await walletHandler.handleTransactions(newCtx);
    },
    {
        name:"view Transaction History",
        description:"This tool is used for fetching and displaying the user's transaction history",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const emailTransfer = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await transferHandler.handleEmailTransfer(newCtx);
    },
    {
        name:"email transfer",
        description:"This tool is used for transferring assets to a recepient email",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const walletTransfer = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await transferHandler.handleWalletTransfer(newCtx);
    },
    {
        name:"wallet transfer",
        description:"This tool is used for transferring assets to a recipeint wallet address",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const bankWithdrawal = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await transferHandler.handleBankWithdrawal(newCtx);
    },
    {
        name:"Bank Withdrawal",
        description:"This tool is used for withdrawing assets to the user's bank account",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);
const recentTransfers = tool(
    async({ctx})=>{
        if(!ctx.userId) return;
        const newCtx = getContext(ctx.userId);
        await transferHandler.handleRecentTransfers(newCtx);
    },
    {
        name:"View recent Transfers",
        description:"This tool is used for fetching and displaying the recent transfers to the users",
        schema: z.object({
            ctx:z.custom<UserContext>().describe("This is the Context to be passed to the telegram API")
        })
    }
);

export const apiTools = [
    viewProfile,
    recentTransfers,
    bankWithdrawal,
    walletTransfer,
    emailTransfer,
    transactions,
    deposit,
    setDefault,
    balances,
    wallets,
    Logout,
    Login,
    sendMessage,
    viewKYCStatus
]