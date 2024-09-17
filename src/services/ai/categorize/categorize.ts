import { TResponse } from "../../../app.model";
import { ImageDetectionData } from "../vision/vision.model";
import { CategorizeImageDetectionData, Category, TextData } from "./categorize.model";
import { fetcher, phoneNumberRegex } from "../../../utils";

/**
 * @param {ImageDetectionData} detected text and colors in the image
 * @returns `{data: categorized_image_detection_data}` | `{errors[]}`
 */
const categorizeImageText = async (
  imageText: ImageDetectionData
): Promise<TResponse<CategorizeImageDetectionData>> => {
  try {
    // I would suggest here to cache the response from the brands and discs endpoints in the REdis DB or AWS similar services
    // and get the data from the cache. This cache has to be revalidated from maybe several days by deleting the data from the cache DB,
    // request data from the rds and store it in the cache DB again 
    const [brandsResponse, discsResponse] = await Promise.allSettled<{data: Record<string, any>[]}>([
      fetcher("https://drn-api-v2.discrescuenetwork.com/brands"),
      fetcher("https://drn-api-v2.discrescuenetwork.com/discs")
    ]);

    if (brandsResponse.status === 'rejected' || discsResponse.status === 'rejected') {
      return { errors: [{ message: 'Error fetching data from brands or discs API', code: '500'}] };
    }

    let brands = [];
    let discs = [];

    if (brandsResponse.status === 'fulfilled' && brandsResponse.value?.data) {
      const { value } = brandsResponse;

      brands = value.data.reduce<string[]>((prev, data) => {
        const { attributes } = data;
        const { BrandName } = attributes;
        prev.push((BrandName as string ).toLocaleLowerCase());
        return prev;
      }, []);
    }

    if (discsResponse.status === 'fulfilled' && discsResponse.value?.data) {
      const { value } = discsResponse;

      discs = value.data.reduce<string[]>((prev, data) => {
        const { attributes } = data;
        const { MoldName } = attributes;
        prev.push((MoldName as string).toLocaleLowerCase());
        return prev;
      }, []);
    }

    const { text, colors } = imageText;

    const words = text.words.map(word => {
      switch (true) {
        case phoneNumberRegex.test(word.word):
          return {
            ...word,
            category: Category.PhoneNumber
          };
        default:
          const isBrandFound = brands.findIndex(brand => {
            if (brand.includes(' ')) {
              const splitedBrand = brand.split(' ');
              return splitedBrand.includes(word.word.toLocaleLowerCase());
            } else {
              return brand.includes(word.word.toLocaleLowerCase());
            }
          });

          if (isBrandFound !== -1) {
            return {
              ...word,
              category: Category.Brand
            };
          }

          const isDiscFound = discs.findIndex(disc => {
            if (disc.includes(' ')) {
              const splitedBrand = disc.split(' ');
              return splitedBrand.includes(word.word.toLocaleLowerCase());
            } else {
              return disc.includes(word.word.toLocaleLowerCase());
            }
          });

          if (isDiscFound !== -1) {
            return {
              ...word,
              category: Category.Disc
            };
          }

          return {
            ...word,
            category: Category.NA
          }
      }
    });

    text.words = words;

    const highestScoreColor = colors.reduce((prev, current) => {
      return (prev.score > current.score) ? prev : current;
    });

    return { data: {
      text: text as TextData,
      colors: { primary: highestScoreColor.name, score: highestScoreColor.score }
    } };
  } catch (e) {
    console.error(e, "categorize text error (categorizeImageText)");
    return { errors: [] };
  }
};

export default {
  categorizeImageText,
};
