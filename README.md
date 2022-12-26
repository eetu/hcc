Control center for home hue bridge

## Roadmap

1. Show all temperatures from philips motion sensors
2. ?
3. Profit

## Getting Started

### Environment

```bash
OPEN_WEATHER_API_KEY=get your api key to open weathe all api
HUE_BRIDGE_ADDRESS=can be seen on console when doing initial load / connecting to hub
HUE_BRIDGE_USER=same
HUE_BRIDGE_USER_CLIENT_KEY=same
POSITION_LAT=where you at?
POSITION_LON=
LANGUAGE=fi
HCC_IMAGE_TAG=version seen on front page
ROOMS={"sensorId": { "name": "Room name", "type": "inside/inside_cold/outside" }}
```

To show sensors in correct categories you need to figure out your rooms by checking console for temperature sensors. Seems sensor only provides official name and not frindlyname given in HUE app. There might be a way to get friendly name. Figure it out and contribute

```bash
temperature sensors:
[
  'Hue temperature sensor 1: xx:xx:...',
]

# might become in .env
ROOMS={"xx:xx:...": { "name": "I am a teapot", "type": "inside" }}
```

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Media

![screenshot](/documentation/screenshot.png)
