import { NextApiRequest, NextApiResponse } from "next";

import { checkConnection } from "../../../lib/hue";
import { getStatus } from "../weather/tomorrow";

type Response = {
  hue: boolean;
  weather: boolean;
};

const handler = async (
  _req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  const [hue, weatherStatus] = await Promise.all([checkConnection(), getStatus()]);
  res.status(200).json({ hue, weather: weatherStatus });
};

export default handler;
