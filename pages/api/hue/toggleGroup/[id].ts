import type { NextApiRequest, NextApiResponse } from "next";

import { toggleGroup } from "../../../../lib/hue";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { id } = req.query as { id: string };
  await toggleGroup(id);
  res.status(200).end();
};

export default handler;
