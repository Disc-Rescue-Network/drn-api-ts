import { ImageAnnotatorClient } from "@google-cloud/vision";
import credentials from "./credentials.json";
import { TResponse } from "../../../app.model";
import { ImageDetectionData, TextData } from "./vision.model";
import colorName from "color-namer";
import { Categories, getCategory } from "../../../utils/utils";

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
    const primaryColor = colors.reduce((prev, current) => {
      return (prev.score > current.score) ? prev : current;
    }, colors[0]);
    const primaryColorName = primaryColor.name;
    const primaryColorScore = primaryColor.score;
    const colorData = {
      primary: primaryColorName,
      score: primaryColorScore,
    }
    

    const brands = await fetch("https://drn-api-v2.discrescuenetwork.com/brands")
      .then(response => response.json())
      .catch(error => {
        console.error("Error fetching brands:", error);
        return [];
      });

    const brandNames = brands.data.map(brand => brand.attributes.BrandName);

    const discs = await fetch("https://drn-api-v2.discrescuenetwork.com/discs")
    .then(response => response.json())
    .catch(error => {
      console.error("Error fetching discs:", error);
      return [];
    });

  const discNames = discs.data.map(disc => disc.attributes.MoldName);
    
    const words= text.words.map(obj => {
      const category = getCategory(obj.word, brandNames, discNames);
      if (
        category === Categories.phoneNumber
        || category === Categories.brand
        || category === Categories.disc
        || category === Categories.color
      ) {
        return {
          ...obj, 
          category
        }
      }
      return obj;
    })
    
    const textData = {
      confidence: text.confidence,
      words: words,
    };

    return { data: { text: textData, colors: colorData } };
  } catch (e) {
    console.error(e, "vision text error (getImageText)");
    return { errors: [] };
  }
};

export default {
  getImageText,
};
