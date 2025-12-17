"use server";
import { OpenAI } from "openai";
import { mockImage } from "./mockImage";
import { generatePrompt } from "./prompter";
import { log } from "console";

const initOpenAI = async () => {
  try {
    const openai = new OpenAI();

    log("OpenAI API initialized");
    return openai;
  } catch (error) {
    console.error("Error initializing OpenAI API:", error);
  }
};

/**
 * It can be useful to disable image generation for development time,
 * so that there's less OpenAI api use 💸
 */
const enableImageGeneration = process.env.IMAGE_GENERATION_ENABLED;

export const generateImage = async () => {
  if (enableImageGeneration === 'true') {
    log("generating image");
    const prompt = await generatePrompt();

    const openai = await initOpenAI();

    const response = await openai?.images.generate({
      model: 'gpt-image-1.5',
      prompt,
      background: 'opaque',
      output_format: 'png',
      quality: 'medium',
      size: '1536x1024'
    });

    return response?.data?.at(0)?.b64_json;
  } else {
    log("Returning the mock image instead of generating with the API");
    return mockImage();
  }
};
