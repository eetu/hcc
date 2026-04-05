import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import type { NextApiRequest, NextApiResponse } from "next";

import { pairWithBridge } from "../../../lib/hue";

dotenv.config();

const env = cleanEnv(process.env, {
  HUE_BRIDGE_ADDRESS: str({ default: "" }),
});

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const bridgeIp = (req.body?.bridgeIp as string | undefined) || env.HUE_BRIDGE_ADDRESS;
  if (!bridgeIp) {
    res.status(400).json({ error: "bridgeIp required (or set HUE_BRIDGE_ADDRESS)" });
    return;
  }

  try {
    const credentials = await pairWithBridge(bridgeIp);
    res.json({
      message: "Pairing successful. Add these to your .env:",
      HUE_BRIDGE_ADDRESS: bridgeIp,
      HUE_BRIDGE_USER: credentials.username,
      HUE_BRIDGE_USER_CLIENT_KEY: credentials.clientkey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pairing failed";
    res.status(400).json({ error: message });
  }
};

export default handler;
