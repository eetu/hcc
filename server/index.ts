import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { discovery, api } from "node-hue-api";
import { cleanEnv, str } from "envalid";
import { Api } from "node-hue-api/dist/esm/api/Api";
import dotenv from "dotenv";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

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

const start = async () => {
  await app.prepare();

  const hueApi = await getHueApi();

  if (!hueApi) {
    throw Error("Failed to get hue API");
  }

  const sensors = await hueApi.sensors.getAll();
  const temperatureSensors = sensors.filter((s) => s.type === "ZLLTemperature");

  temperatureSensors.forEach((s) => {
    const id = s.getAttributeValue("id");
    const name = s.getAttributeValue("name");
    const temperature = s.getStateAttributeValue("temperature");
    console.log(`${name} (${id}): ${temperature / 100}`);
  });

  createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    const { pathname, query } = parsedUrl;

    if (pathname === "/foobar") {
      console.log(JSON.stringify(query, null, 2));
      app.render(req, res, "/posts", query);
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
};

start();
