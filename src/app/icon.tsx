import { ImageResponse } from "next/og";

import { Mark } from "@/lib/og";

/** The browser-tab icon. 32 rather than 16 because every current browser takes the
 *  larger one and downscales it, and the mark's inner sheet survives that better
 *  than it survives being drawn at 16. */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const Icon = () => new ImageResponse(<Mark size={32} />, size);

export default Icon;
