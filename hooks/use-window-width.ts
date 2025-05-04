import { useEffect, useState } from "react";

export function useWindowWidth(defaultWidth = 360) {
  const [width, setWidth] = useState(defaultWidth);
  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}
