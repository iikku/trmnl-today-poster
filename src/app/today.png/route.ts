import { NextRequest, NextResponse } from "next/server";
import { fetchImage } from "../imageCache";
import { log } from "console";
import { transmogrify } from "./imageTransmogrifier"

export const GET = async (
  req: NextRequest,
  route: {},
) => {
  const generatedImage = await fetchImage();
  const suitedForTRMNL = await transmogrify(generatedImage);

  if (suitedForTRMNL) {
    return new NextResponse(
      suitedForTRMNL,
      {
        status: 200,
        headers: {
          "Content-Length": suitedForTRMNL.length.toString(),
          'Content-Type': "image/png"
        }
      }
    );
  } else {
    log("Can't return the image 'cause there is no image");
  }
}
