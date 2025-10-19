"use server";

import React from 'react';
import Image from "next/image";

export default async function Poster() {
  return (
    <div>
      <Image
        src={'/today.png'}
        alt={'Tänään'}
        fill={true}
        className="object-contain"
      />
    </div>
  );
}
