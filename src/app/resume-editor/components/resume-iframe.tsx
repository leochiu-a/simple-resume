"use client";

import dynamic from "next/dynamic";
import { PropsWithChildren } from "react";
import Frame from "react-frame-component";

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

const ResumeIframe = ({ children }: PropsWithChildren) => {
  const width = 595;
  const height = 842;
  const scale = 0.6;

  return (
    <div
      style={{
        maxWidth: `${width * scale}px`,
        maxHeight: `${height * scale}px`,
      }}
    >
      {/* There is an outer div and an inner div here. The inner div sets the iframe width and uses transform scale to zoom in/out the resume iframe.
          While zooming out or scaling down via transform, the element appears smaller but still occupies the same width/height. Therefore, we use the 
          outer div to restrict the max width & height proportionally */}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }}
        className={`origin-top-left bg-white shadow-lg`}
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
