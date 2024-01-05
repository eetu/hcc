const GroupLightState =
  require("node-hue-api").v3.model.lightStates.GroupLightState;
import { NextApiRequest, NextApiResponse } from "next";

import { getHueApi } from "..";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  const { query } = req;

  const hueApi = await getHueApi();

  if (!hueApi) {
    throw Error("Failed to get hue API");
  }

  const { id } = query;

  const groupId = Number(id);

  if (!isNaN(groupId)) {
    const currentState: any = await hueApi.groups.getGroupState(Number(id));
    const nextState = currentState.any_on
      ? new GroupLightState().off()
      : new GroupLightState().on();
    const success = await hueApi.groups.setGroupState(groupId, nextState);
    if (success) {
      return res.status(200).end();
    } else {
      return res.status(500).end();
    }
  } else {
    return res.status(400).end();
  }
}
