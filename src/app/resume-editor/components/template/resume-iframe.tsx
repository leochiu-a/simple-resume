"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren, useEffect, useState } from "react";
import Frame from "react-frame-component";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "./constants";

const INITIAL_CONTENT = `
<!DOCTYPE html>
<html>
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0;">
    <div></div>
  </body>
</html>
`;

const useResumeScale = () => {
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const getDefaultScale = () => {
      const screenHeightPx = window.innerHeight;
      const navHeight = 48;
      const dockHeight = 48;
      const resumePadding = 32 * 2;
      const resumeHeight =
        screenHeightPx - navHeight - dockHeight - resumePadding;

      const scale = resumeHeight / A4_HEIGHT_PX;

      return scale;
    };

    const setDefaultScale = () => {
      const defaultScale = getDefaultScale();
      setScale(defaultScale);
    };

    setDefaultScale();
    window.addEventListener("resize", setDefaultScale);

    return () => {
      window.removeEventListener("resize", setDefaultScale);
    };
  }, []);

  return scale;
};

const ResumeIframe = ({ children }: PropsWithChildren) => {
  const scale = useResumeScale();

  return (
    <div
      style={{
        maxWidth: `${A4_WIDTH_PX * scale}px`,
        maxHeight: `${A4_HEIGHT_PX * scale}px`,
      }}
    >
      {/* There is an outer div and an inner div here. The inner div sets the iframe width and uses transform scale to zoom in/out the resume iframe.
          While zooming out or scaling down via transform, the element appears smaller but still occupies the same width/height. Therefore, we use the 
          outer div to restrict the max width & height proportionally */}
      <div
        style={{
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
        className={`origin-top-left bg-white shadow-xl`}
      >
        <Frame
          style={{ width: "100%", height: "100%" }}
          initialContent={INITIAL_CONTENT}
        >
          <div>{children}</div>
        </Frame>
      </div>
    </div>
  );
};

const ResumeIframeCSR = dynamic(() => Promise.resolve(ResumeIframe), {
  ssr: false,
});

export default ResumeIframeCSR;
