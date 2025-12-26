import { log } from "console";
import { join } from "path";
import { tmpdir } from "os";
import { readFile, writeFile } from "fs/promises";
import { execFile } from "child_process";

/**
 * Makes the image dithered grayscale and 800x480 resized.
 */
export const transmogrify = async (image: string) => {
  if (image) {
    // Write the file to the filesystem for black and white conversion with ImageMagick
    const imgBuffer = Buffer.from(image, "base64")

    const inputFile = join(tmpdir(), "in.png")
    const outputFile = join(tmpdir(), "out.png")

    await writeFile(inputFile, imgBuffer);

    // See https://docs.usetrmnl.com/go/imagemagick-guide for details of the conversion

    const conversionToTwoBitImage = true;
    if (!conversionToTwoBitImage) {
      // convert to 1 bit
      const colormap = join(tmpdir(), "colormap-1bit.png")

      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          ["-size", "2x1", "xc:#000000", "xc:#ffffff", "+append", "-type", "Palette", colormap],
          (err) =>
            err ? reject(err) : resolve()
        )
      )

      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          [inputFile,
            "(", "+clone", "-resize", "800x480^", "-gravity", "center", "-extent", "800x480", "-blur", "0x15", ")",
            "-resize", "800x480", "-swap", "0,1",
            "-gravity", "center", "-compose", "over", "-composite",
            "-dither", "FloydSteinberg", "-remap", colormap, "-define", "png:bit-depth=1", "-define", "png:color-type=0",
            outputFile],
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
          ["-size", "4x1", "xc:#000000", "xc:#555555", "xc:#aaaaaa", "xc:#ffffff", "+append", "-type", "Palette", colormap],
          (err) =>
            err ? reject(err) : resolve()
        )
      )

      await new Promise<void>((resolve, reject) =>
        execFile(
          "magick",
          [inputFile,
            "(", "+clone", "-resize", "800x480^", "-gravity", "center", "-extent", "800x480", "-blur", "0x15", ")",
            "-resize", "800x480", "-swap", "0,1",
            "-gravity", "center", "-compose", "over", "-composite",
            "-dither", "FloydSteinberg", "-remap", colormap, "-define", "png:bit-depth=2", "-define", "png:color-type=0",
            outputFile],
          (err) =>
            err ? reject(err) : resolve()
        )
      )
    }

    // Read the converted image from the filesystem and send in the response
    var blackAndWhiteVersion = await readFile(outputFile);

    log("Image transmogrified into grayscale");
    return blackAndWhiteVersion;
  } else {
    log("Can't return the image 'cause there is no image");
    return null;
  }
}
