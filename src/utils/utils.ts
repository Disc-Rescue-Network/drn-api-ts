import { ImageDetectionData, TextData } from "../services/ai/vision/vision.model";

export enum Categories {
  color = "color",
  brand = "brand",
  disc = "disc",
  phoneNumber = "phonenumber",
}

export const getCategory = (
  word: string,
  brands: string[],
  discs: string[]
): Categories | null => {
  // check if phonenumber
  const phoneNumberPattern = /^\d{3}-\d{3}-\d{4}$|^\d{10}$/;
  if (phoneNumberPattern.test(word)) {
    return Categories.phoneNumber;
  }

  const trimmedWord = word.trim().toLowerCase();

  // check if brand
  if (brands.map((brand) => brand.trim().toLowerCase()).includes(trimmedWord)) {
    return Categories.brand;
  }

  // check if disc
  if (discs.map((disc) => disc.trim().toLowerCase()).includes(trimmedWord)) {
    return Categories.disc;
  }

  // check if color
  return null;
};

// Levenshtein Distance Function
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment along the first row of each column
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Function to Calculate Similarity Percentage
function calculateSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength; // Similarity score between 0 and 1
}

// Main Function to Find Similar Substring
export function findSimilarSubstring(
  sentenceA: string,
  substringB: string,
  similarityThreshold: number
): { bestMatch: string; similarity: number } | null {
  const wordsA = sentenceA.split(/\s+/); // Split sentence A into words
  const lenB = substringB.length;

  if (lenB === 0) return { bestMatch: null, similarity: 0 }; // If substring B is empty, no match

  let bestMatch: string = "";
  let bestSimilarity: number = 0;

  // Slide through all possible word combinations in A
  for (let i = 0; i < wordsA.length; i++) {
    for (let j = i + 1; j <= wordsA.length; j++) {
      const substringA: string = wordsA.slice(i, j).join(" "); // Join words to form the substring
      const similarity: number = calculateSimilarity(substringA, substringB);

      // Update the best match if a more similar one is found
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = substringA;
      }
    }
  }

  // Return best match and similarity
  if (bestMatch) {
    return bestSimilarity >= similarityThreshold
      ? { bestMatch, similarity: bestSimilarity }
      : null;
  }
  return null;
}


/**
 * Processes text data to extract brands, discs, and phone numbers, and calculates their confidence scores.
 *
 * @param {TextData} text - The text data containing words and their confidence scores.
 * @param {string} concatenatedString - The concatenated string of all words in the text data.
 * @param {Array<{ color: { red: number, green: number, blue: number }, score: number, name: string }>} colors - The array of color data.
 * @returns {Promise<{ totalDataResult: Array<{ confidence: number, word: string, category: string }>, averageConfidence: number }>}
 */
export async function processTextData(
  text: TextData,
  concatenatedString: string,
  colors: Array<{ color: { red: number, green: number, blue: number }, score: number, name: string }>
): Promise<{
  totalDataResult: Array<{ confidence: number, word: string, category: string }>,
  averageConfidence: number,
}> {
  const totalDataResult = [];

  // Check brand
  const brands = await fetch("https://drn-api-v2.discrescuenetwork.com/brands")
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching brands:", error);
      return [];
    });

  interface MatchedBrand {
    brandName: string;
    bestMatch: string;
    similarity: number;
    confidence?: number;
  }

  const bestMatchMap: Map<string, MatchedBrand> = new Map();

  for (let i = 0; i < brands.data.length; i++) {
    const brand = brands.data[i];
    const brandLowcase = brand.attributes.BrandName.toLowerCase();

    // Find the best match
    const bestMatchResult = findSimilarSubstring(
      concatenatedString,
      brandLowcase,
      0.8
    );

    if (bestMatchResult !== null && bestMatchResult.bestMatch !== null) {
      const { bestMatch, similarity } = bestMatchResult;

      // Update the map with the highest confidence for each bestMatch
      if (
        !bestMatchMap.has(bestMatch) ||
        bestMatchMap.get(bestMatch)!.similarity < similarity
      ) {
        // Find words from text that match parts of the bestMatch string
        const bestMatchWords = text.words.filter((wordObj) =>
          bestMatch.includes(wordObj.word.toLowerCase())
        );

        // Retrieve confidences for matching words
        const confidences = bestMatchWords.map(
          (wordObj) => wordObj.confidence
        );

        // Calculate average confidence
        const totalConfidence = confidences.reduce(
          (sum, conf) => sum + conf,
          0
        );
        const averageConfidence =
          confidences.length > 0 ? totalConfidence / confidences.length : 0;

        // Update the bestMatchMap
        bestMatchMap.set(bestMatch, {
          brandName: brandLowcase,
          bestMatch: bestMatch,
          similarity,
          confidence: averageConfidence, // Use average confidence here
        });
      }
    }
  }
  // Loop through bestMatchMap to remove best match strings from concatenatedString
  for (const [bestMatch] of bestMatchMap.entries()) {
    // Remove the best match substring from concatenatedString
    concatenatedString = concatenatedString.replace(bestMatch, "").trim();
  }

  // check disc
  const discs = await fetch("https://drn-api-v2.discrescuenetwork.com/discs")
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching discs:", error);
      return [];
    });

  // Define an interface for matched discs
  interface MatchedDisc {
    discName: string;
    bestMatch: string;
    similarity: number;
    confidence?: number;
  }

  // Map to track the best similarity for each bestMatch in discs
  const bestDiscMatchMap: Map<string, MatchedDisc> = new Map();

  for (let i = 0; i < discs.data.length; i++) {
    const disc = discs.data[i];
    const discLowcase = disc.attributes.MoldName.toLowerCase();

    // Find the best match for discs
    const bestMatchResult = findSimilarSubstring(
      concatenatedString,
      discLowcase,
      0.8
    );

    if (bestMatchResult !== null && bestMatchResult.bestMatch !== null) {
      const { bestMatch, similarity } = bestMatchResult;

      // Update the map with the highest similarity for each bestMatch
      if (
        !bestDiscMatchMap.has(bestMatch) ||
        bestDiscMatchMap.get(bestMatch)!.similarity < similarity
      ) {
        // Find words from text that match parts of the bestMatch string
        const bestMatchWords = text.words.filter((wordObj) =>
          bestMatch.includes(wordObj.word.toLowerCase())
        );

        // Retrieve confidences for matching words
        const confidences = bestMatchWords.map(
          (wordObj) => wordObj.confidence
        );

        // Calculate average confidence
        const totalConfidence = confidences.reduce(
          (sum, conf) => sum + conf,
          0
        );
        const averageConfidence =
          confidences.length > 0 ? totalConfidence / confidences.length : 0;

        bestDiscMatchMap.set(bestMatch, {
          discName: discLowcase,
          bestMatch: bestMatch,
          similarity: similarity,
          confidence: averageConfidence, // Use average confidence here
        });
      }
    }
  }
  // Loop through bestMatchMap to remove best match strings from concatenatedString
  for (const [bestMatch] of bestDiscMatchMap.entries()) {
    // Remove the best match substring from concatenatedString
    concatenatedString = concatenatedString.replace(bestMatch, "").trim();
  }

  // Phone check
  function extractPhoneNumbers(input) {
    const phoneNumberPattern =
      /\+?(\d{1,3})?[-.\s]?(\(?\d{2,3}?\)?)?[-.\s]?(\d{3})[-.\s]?(\d{3,4})[-.\s]?(\d{0,4})/g;
    return input.match(phoneNumberPattern) || []; // Returns an array of matches or an empty array if none found
  }

  // Remove all space characters from concatenatedString
  const cleanedString = concatenatedString.replace(/\s+/g, "");

  // Example usage:
  const inputString = cleanedString;
  const phoneNumbers = extractPhoneNumbers(inputString);

  // Calculate average confidence for the extracted phone numbers
  const phoneConfidences = phoneNumbers.map((phoneNumber) => {
    // Find words from text that match parts of the bestMatch string
    const bestMatchWords = text.words.filter((wordObj) =>
      phoneNumber.includes(wordObj.word.toLowerCase())
    );

    // Retrieve confidences for matching words
    const confidences = bestMatchWords.map((wordObj) => wordObj.confidence);

    // Calculate average confidence
    const totalConfidence = confidences.reduce((sum, conf) => sum + conf, 0);
    const averageConfidence =
      confidences.length > 0 ? totalConfidence / confidences.length : 0;

    return {
      phoneNumber,
      confidence: averageConfidence, // Replace with actual confidence logic if available
    };
  });

  // Loop through bestMatchMap to remove best match strings from concatenatedString
  for (const [index, phoneConfidence] of phoneConfidences.entries()) {
    // Remove the best match substring from concatenatedString
    const containedWords = text.words.filter((wordObj) =>
      phoneConfidence.phoneNumber.includes(wordObj.word.trim().toLowerCase())
    );
    containedWords.map((word) => {
      concatenatedString = concatenatedString.replace(word.word, "").trim();
    });
  }

  // Add brands to totalDataResult
  bestMatchMap.forEach((matchedBrand) => {
    totalDataResult.push({
      confidence: matchedBrand.confidence,
      word: matchedBrand.brandName,
      category: "Brand",
    });
  });

  // Add discs to totalDataResult
  bestDiscMatchMap.forEach((matchedDisc) => {
    totalDataResult.push({
      confidence: matchedDisc.confidence,
      word: matchedDisc.discName,
      category: "Disc",
    });
  });

  // Add phone numbers to totalDataResult
  phoneConfidences.forEach((phoneConfidence) => {
    totalDataResult.push({
      confidence: phoneConfidence.confidence, // Assuming confidence for phone numbers is perfect
      word: phoneConfidence.phoneNumber,
      category: "Phone Number",
    });
  });

  // Now find matches for each word in text data
  text.words.forEach((wordObj) => {
    const wordLowcase = wordObj.word.toLowerCase();

    // Check if the word is in concatenatedString
    if (concatenatedString.includes(wordLowcase)) {
      // Add the matching word data to totalDataResult
      totalDataResult.push({
        confidence: wordObj.confidence,
        word: wordLowcase,
        category: "",
      });
    }
  });

  // Calculate average confidence
  const totalConfidence = totalDataResult.reduce(
    (sum, entry) => sum + entry.confidence,
    0
  );
  const averageConfidence =
    totalDataResult.length > 0 ? totalConfidence / totalDataResult.length : 0;

  return {
    totalDataResult,
    averageConfidence,
  };
}