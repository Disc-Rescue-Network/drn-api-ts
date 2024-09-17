export enum Category {
  Brand = "Brand",
  Disc = "Disc",
  PhoneNumber = "Phone Number",
  NA = "N/A"
};

export type CategorizeImageDetectionData = {
  text: TextData;
  colors: ColorsData;
};

export type TextData = {
  confidence: number;
  words: {
    word: string;
    confidence: number;
    category: Category;
  }[];
};

export type ColorsData = {
  primary: string;
  score: number;
};
