export enum Categories {
  color = "color",
  brand = "brand",
  disc = "disc",
  phoneNumber = "phonenumber",
}

export const getCategory = (
  word: string, 
  brands: string[], 
  discs: string[],
): Categories | null => {


  // check if phonenumber
  const phoneNumberPattern = /^\d{3}-\d{3}-\d{4}$|^\d{10}$/;
  if (phoneNumberPattern.test(word)) {
    return Categories.phoneNumber;
  }

  const trimmedWord = word.trim().toLowerCase();

  // check if brand
  if (brands.map(brand => brand.trim().toLowerCase()).includes(trimmedWord)) {
    return Categories.brand;
  }


  // check if disc
  if (discs.map(disc => disc.trim().toLowerCase()).includes(trimmedWord)) {
    return Categories.disc;
  }


  // check if color
  return null;
};
