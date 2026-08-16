import { ImageResponse } from "next/og";

import { Mark } from "@/lib/og";

/**
 * The iOS home-screen icon, at the size Apple asks for.
 *
 * Drawn edge to edge with no padding: iOS applies its own mask and shadow, so a mark
 * inset inside its own square ends up as a small logo floating in a large tile.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const AppleIcon = () => new ImageResponse(<Mark size={180} />, size);

export default AppleIcon;
