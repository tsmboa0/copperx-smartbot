import { Context } from "grammy";



const contextStore = new Map();

export function storeContext(chatId: number, ctx: Context) {
  contextStore.set(chatId, ctx);
};

export function getContext(chatId: number) {
  return contextStore.get(chatId);
};