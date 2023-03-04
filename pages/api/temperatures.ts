// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import dotenv from "dotenv";
import { cleanEnv, json, str } from "envalid";
import type { NextApiRequest, NextApiResponse } from "next";
import { Api } from "node-hue-api/dist/esm/api/Api";
import { v3 } from "node-hue-api/dist/esm/v3";

const { api, discovery }: typeof v3 = require("node-hue-api").v3;

dotenv.config();
const env = cleanEnv(process.env, {
  HUE_BRIDGE_USER: str(),
  HUE_BRIDGE_USER_CLIENT_KEY: str(),
  HUE_BRIDGE_ADDRESS: str({
    default: undefined,
  }),
  ROOMS: json(),
});

const getBridgeAddress = async () => {
  if (env.HUE_BRIDGE_ADDRESS) {
    console.log("Bridge IP address provided with env");
    return env.HUE_BRIDGE_ADDRESS;
  }

  const results = await discovery.nupnpSearch();

  if (results.length === 0) {
    console.error("Failed to discover bridge");
    return undefined;
  }

  return results.find((b: any) => !b.error)?.ipaddress;
};

const getUsername = async (unauthenticatedApi: Api) => {
  if (env.HUE_BRIDGE_USER) {
    return env.HUE_BRIDGE_USER;
  }

  const user = await unauthenticatedApi.users.createUser("node-hue-api", "hcc");

  console.log(
    "*******************************************************************************\n"
  );

  console.log(
    "User has been created on the Hue Bridge. The following username can be used to\n" +
      "authenticate with the Bridge and provide full local access to the Hue Bridge.\n" +
      "YOU SHOULD TREAT THIS LIKE A PASSWORD\n"
  );

  console.log(`Hue Bridge User: ${user.username}`);
  console.log(`Hue Bridge User Client Key: ${user.clientkey}`);
  console.log(
    "*******************************************************************************\n"
  );
  return user.username;
};

const getHueApi = async () => {
  const address = await getBridgeAddress();

  console.log(`Tyring to connect bridge at addess: ${address}`);

  if (!address) {
    return undefined;
  }

  const unauthenticatedApi = await api.createLocal(address).connect();

  try {
    const username = await getUsername(unauthenticatedApi);

    // Create a new API instance that is authenticated with the new user we created
    const authenticatedApi = await api.createLocal(address).connect(username);

    const bridgeConfig =
      await authenticatedApi.configuration.getConfiguration();
    console.log(
      `Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`
    );

    return authenticatedApi;
  } catch (err: any) {
    if (err?.getHueErrorType() === 101) {
      console.error(
        "The Link button on the bridge was not pressed. Please press the Link button and try again."
      );
    } else {
      console.error(`Unexpected Error: ${err?.message}`);
    }
  }
};

type RoomType = "inside" | "inside_cold" | "outside";

export type Room = {
  id: string;
  name: string;
  temperature: number;
  type: RoomType;
  enabled: boolean;
  battery?: number;
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Room[]>
) {
  const hueApi = await getHueApi();

  if (!hueApi) {
    throw Error("Failed to get hue API");
  }

  const sensors = await hueApi.sensors.getAll();
  const temperatureSensors = sensors.filter((s) => s.type === "ZLLTemperature");

  console.log("temperature sensors:");
  console.log(
    temperatureSensors.map(
      (t) =>
        `${t.getAttributeValue("name")}: ${t.getAttributeValue("uniqueid")}`
    )
  );

  const temps = temperatureSensors.map((s) => {
    const uniqueid = s.getAttributeValue("uniqueid");
    const room = env.ROOMS[uniqueid];
    const name = room.name;
    const type = room.type;
    const temperature = s.getStateAttributeValue("temperature") / 100;
    const enabled = s.getConfigAttributeValue("on");
    const battery = (s as any).populationData?.config?.battery;

    return {
      id: uniqueid,
      name,
      temperature,
      type,
      enabled,
      battery,
    };
  });

  res.status(200).json(temps);
}
