"use server";

import React from 'react';
import Image from "next/image";
import { generateImage } from "./openai";
import { log } from "console";

export default async function Poster() {
  log("Poster");

  const image = await generateImage();

  return (
    <div>
      <Image
        src={`data:image/jpeg;base64,${image?.data}`}
        alt={image?.quality || 'Hmm'}
        layout="fill"
      />
    </div>
  );
}
