import { useEffect, useState } from "react";

const useCurrentTime = () => {
  const [currenTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return currenTime;
};

export default useCurrentTime;
