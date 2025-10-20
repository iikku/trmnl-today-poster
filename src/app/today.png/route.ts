import { NextRequest, NextResponse } from "next/server";
import { fetchImage } from "../imageCache";
import { log } from "console";
import { join } from "path";
import { tmpdir } from "os";
import { readFile, writeFile } from "fs/promises";
import { execFile } from "child_process";

export const GET = async (
  req: NextRequest,
  route: {},
) => {
  const generatedImage = await fetchImage();

  if (generatedImage) {
    // Write the file to the filesystem for black and white conversion with ImageMagick
    const imgBuffer = Buffer.from(generatedImage, "base64")

    const inputFile = join(tmpdir(), "in.png")
    const outputFile = join(tmpdir(), "out.png")

    await writeFile(inputFile, imgBuffer);

    // See https://docs.usetrmnl.com/go/imagemagick-guide for details of the conversion

    const conversionToTwoBitImage = true;
    if (!conversionToTwoBitImage) {
      // convert to 1 bit
      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          [inputFile, "-resize", "800x480^", "-extent", "800x480", "-monochrome", "-colors", "2", "-depth", "1", "-strip", "png:" + outputFile],
          (err) =>
            err ? reject(err) : resolve()
        )
      )
    }
    else {
      // convert to 2 bit
      const colormap = join(tmpdir(), "colormap-2bit.png")

      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          [inputFile, "-resize", "800x480^", "-extent", "800x480", "-dither", "FloydSteinberg", "-remap", colormap, "-define", "png:bit-depth=2", "-define", "png:color-type=0", outputFile],
          (err) =>
            err ? reject(err) : resolve()
        )
      )

      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          ["-size", "4x1", "xc:#000000", "xc:#555555", "xc:#aaaaaa", "xc:#ffffff", "+append", "-type", "Palette", colormap],
          (err) =>
            err ? reject(err) : resolve()
        )
      )
    }

    // Read the converted image from the filesystem and send in the response
    var blackAndWhiteVersion = await readFile(outputFile);

    return new NextResponse(
      blackAndWhiteVersion,
      {
        status: 200,
        headers: {
          "Content-Length": blackAndWhiteVersion.length.toString(),
          'Content-Type': "image/png"
        }
      }
    );
  } else {
    log("Can't return the image 'cause there is no image");
  }
}
