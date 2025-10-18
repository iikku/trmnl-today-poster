"use server";
import { OpenAI } from "openai";
import { generatePrompt } from "./prompter";

const apiKey = process.env.OPENAI_API_KEY;

const initOpenAI = async () => {
  try {
    const openai = new OpenAI();

    console.log("OpenAI API initialized");
    return openai;
  } catch (error) {
    console.error("Error initializing OpenAI API:", error);
  }
};

const enableImageGeneration = false;

export const generateImage = async () => {
  console.log("generateImage");

  const prompt = await generatePrompt();
  
  if (enableImageGeneration) {
    const openai = await initOpenAI();

    const response = await openai?.images.generate({
      model: 'gpt-image-1',
      prompt,
      background: 'opaque',
      output_format: 'png',
      quality: 'medium',
      size: '1536x1024'
    });

    console.log("response", response);

    return response;
  } else {
    return null;
  }
};
