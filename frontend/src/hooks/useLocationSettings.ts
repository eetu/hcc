import { useCallback } from "react";
import useSWR from "swr";

import { api, fetcher } from "../api";

export type LocationInfo = {
  lat: number;
  lon: number;
  displayName: string;
};

type UserSettings = {
  location?: LocationInfo;
};

const useLocationSettings = () => {
  const { data, mutate } = useSWR<UserSettings>(api("/api/settings"), fetcher);

  const location = data?.location ?? null;

  const saveLocation = useCallback(
    async (loc: LocationInfo) => {
      const updated = { ...data, location: loc };
      await fetch(api("/api/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      mutate(updated);
    },
    [data, mutate],
  );

  return { location, saveLocation, isLoading: !data };
};

export default useLocationSettings;
