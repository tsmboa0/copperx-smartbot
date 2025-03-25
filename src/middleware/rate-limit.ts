import mongoose from 'mongoose';
import { Context, Middleware } from 'grammy';
import { RateLimit } from '../entities/user.entity';



// Rate Limit Middleware (MongoDB)
export const rateLimitMiddleware = (limit: number, intervalMs: number) => async (ctx:Context, next:()=>Promise<void>) => {
  if (!ctx.from) return next();
  const userId = ctx.from.id.toString();

  const now = Date.now();
  let userRate = await RateLimit.findOne({ userId });

  if (!userRate) {
    userRate = new RateLimit({ userId, timestamps: [] });
    await userRate.save()
  }

  // Remove old timestamps
  userRate.timestamps = userRate.timestamps.filter((t:any) => now - t < intervalMs);

  if (userRate.timestamps.length >= limit) {
    return ctx.reply('⚠️ You are sending too many requests. Please wait a minute.');
  }

  // Add new request timestamp
  userRate.timestamps.push(now);
  await userRate.save();

  console.log("welcome to rate limit middleware");

  return await next();
};
