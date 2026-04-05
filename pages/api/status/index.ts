import { NextApiRequest, NextApiResponse } from "next";

import { checkConnection } from "../../../lib/hue";
import { getStatus } from "../weather/tomorrow";

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse<{ hue: boolean; weather: boolean }>,
): Promise<void> => {
  const [hue, weatherStatus] = await Promise.all([checkConnection(), getStatus()]);
  res.status(200).json({ hue, weather: weatherStatus });
};

export default handler;
