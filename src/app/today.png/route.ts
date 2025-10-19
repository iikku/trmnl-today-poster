import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "../openai";
import { log } from "console";

export const GET = async (
  req: NextRequest,
  route: {},
) => {
  const image = await generateImage();

  if (image) {
    const imgBuffer = Buffer.from(image, "base64")

    return new NextResponse(
      imgBuffer,
      {
        status: 200,
        headers: {
          'Content-Type': "image/png;base64"
        }
      }
    );
  } else {
    log("Can't send the image 'cause there is no image");
  }
}
