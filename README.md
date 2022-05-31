Control center for home hue bridge

## Roadmap

1. Show all temperatures from philips motion sensors and Forecast from OpenWeather API
2. ?
3. Profit

## Getting Started

First, run the development server:

```bash
yarn dev
```

It tries to detect Philips HUB running on the same network and tries to connect with it. Library outputs user/key which can be given as envs to faster startup later.

|env|description|
|HUE_BRIDGE_USER||
|HUE_BRIDGE_USER_CLIENT_KEY|generated when connecting to HUB by pressing the connect button|
|HUE_BRIDGE_ADDRESS|you can manually define IP if the are any problems detecting the HUB automatically|

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Media

![screenshot](/documentation/screenshot.png)
