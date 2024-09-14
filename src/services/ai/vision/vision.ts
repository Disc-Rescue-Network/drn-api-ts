import { ImageAnnotatorClient } from "@google-cloud/vision";
import credentials from "./credentials.json";
import { TResponse } from "../../../app.model";
import { ImageDetectionData, TextData } from "./vision.model";
import colorName from "color-namer";
import {
  Categories,
  findSimilarSubstring,
  getCategory,
  processTextData,
} from "../../../utils/utils";

const imgAnnotator = new ImageAnnotatorClient({ credentials });

/**
 * use {@link imgAnnotator} to get google vision data for a base64 image
 *
 * @param {string} img base64 image
 * @returns `{data: image_detection_data}` | `{errors[]}`
 */
const getImageText = async (
  img: string
): Promise<TResponse<ImageDetectionData>> => {
  try {
    const req = {
      image: {
        content: Buffer.from(img, "base64"),
      },
      features: [
        {
          type: "IMAGE_PROPERTIES",
        },
        {
          type: "DOCUMENT_TEXT_DETECTION",
        },
      ],
    };
    const imgData = await imgAnnotator.annotateImage(req);
    const text = imgData[0].fullTextAnnotation.pages[0].blocks.reduce(
      (prev, data) => {
        data.paragraphs.reduce((w, e) => {
          const wordSet = e.words.map((b) => {
            console.log("b.symbo", b.symbols);

            return {
              confidence: b.confidence,
              word: b.symbols
                .map((x) => {
                  return x.text;
                })
                .join(""),
            };
          });
          prev.words.push(...wordSet);
          return w;
        }, []);
        return prev;
      },
      {
        confidence: imgData[0].fullTextAnnotation.pages[0].confidence,
        words: [],
      } as TextData
    );
    const colors =
      imgData[0].imagePropertiesAnnotation?.dominantColors.colors.map(
        (color) => {
          return {
            ...color,
            name: colorName(
              `rgb(${color.color.red},${color.color.green},${color.color.blue})`
            ).ntc[0].name,
          };
        }
      );

    
    // Concatenated entire string
    let concatenatedString = text.words
      .map((wordObj) => wordObj.word)
      .join(" ")
      .toLowerCase();
    
    const {totalDataResult,averageConfidence } =  await processTextData(text, concatenatedString, [])

    const primaryColor = colors.reduce((prev, current) => {
      return prev.score > current.score ? prev : current;
    }, colors[0]);
    const primaryColorName = primaryColor?.name;
    const primaryColorScore = primaryColor?.score;
    const colorData = {
      primary: primaryColorName,
      score: primaryColorScore,
    };

    return {
      data: {
        text: { confidence: averageConfidence, words: totalDataResult },
        colors: colorData,
      },
    };
  } catch (e) {
    console.error(e, "vision text error (getImageText)");
    return { errors: [] };
  }
};

export default {
  getImageText,
};
