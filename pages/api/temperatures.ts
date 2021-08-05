// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { discovery, api } from "node-hue-api";
import { cleanEnv, str } from "envalid";
import { Api } from "node-hue-api/dist/esm/api/Api";
import dotenv from "dotenv";

dotenv.config();
const env = cleanEnv(process.env, {
  HUE_BRIDGE_USER: str(),
  HUE_BRIDGE_USER_CLIENT_KEY: str(),
});

const getBridgeAddress = async () => {
  const results = await discovery.nupnpSearch();

  if (results.length === 0) {
    console.error("Failed to discover bridge");
    return "";
  }
  return results[0].ipaddress;
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
  if (address.length === 0) {
    return undefined;
  }

  const unauthenticatedApi = await api.createLocal(address).connect();

  try {
    const username = await getUsername(unauthenticatedApi);

    // Create a new API instance that is authenticated with the new user we created
    const authenticatedApi = await api.createLocal(address).connect(username);

    const bridgeConfig = await authenticatedApi.configuration.getConfiguration();
    console.log(
      `Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`
    );

    return authenticatedApi;
  } catch (err) {
    if (err.getHueErrorType() === 101) {
      console.error(
        "The Link button on the bridge was not pressed. Please press the Link button and try again."
      );
    } else {
      console.error(`Unexpected Error: ${err.message}`);
    }
  }
};

type Data = {
  id: string;
  name: string;
  temperature: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data[]>
) {
  const hueApi = await getHueApi();

  if (!hueApi) {
    throw Error("Failed to get hue API");
  }

  const sensors = await hueApi.sensors.getAll();
  const temperatureSensors = sensors.filter((s) => s.type === "ZLLTemperature");

  const temps = temperatureSensors.map((s) => {
    const id = s.getAttributeValue("id");
    const name = s.getAttributeValue("name");
    const temperature = s.getStateAttributeValue("temperature");

    console.log(`${name} (${id}): ${temperature / 100}`);

    return {
      id,
      name,
      temperature,
    };
  });

  res.status(200).json(temps);
}
