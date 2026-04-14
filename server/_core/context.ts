import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: any | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Mock authentication since OAuth variables were removed
  const openId = "local-dev-user";
  let user = await db.getUserByOpenId(openId);
  
  if (!user) {
    await db.upsertUser({
      openId,
      name: "Local User",
      email: "local@example.com",
      role: "admin",
      lastSignedIn: new Date()
    });
    user = await db.getUserByOpenId(openId);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
