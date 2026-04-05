import type { NextApiRequest, NextApiResponse } from "next";

import { getHueData } from "../../../lib/hue";

export type { Group, Response, Sensor } from "../../../lib/hue";

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  res.json(await getHueData());
};

export default handler;
