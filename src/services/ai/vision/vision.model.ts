import { google } from "@google-cloud/vision/build/protos/protos";

export type ImageDetectionData = {
  text: TextData;
  colors: {
    primary: string;
    score: number;
  }
};
export type TextData = {
  confidence: number;
  words: {
    word: string;
    confidence: number;
    category?: string;
  }[];
};
