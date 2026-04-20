import { useCallback, useState } from "react";

type GeoLocationState = {
  loading: boolean;
  error: string | null;
  position: { lat: number; lon: number } | null;
};

const useGeoLocation = () => {
  const [state, setState] = useState<GeoLocationState>({
    loading: false,
    error: null,
    position: null,
  });

  const detect = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({
        loading: false,
        error: "Geolocation not supported",
        position: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          loading: false,
          error: null,
          position: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        });
      },
      (err) => {
        setState({ loading: false, error: err.message, position: null });
      },
    );
  }, []);

  return { ...state, detect };
};

export default useGeoLocation;
