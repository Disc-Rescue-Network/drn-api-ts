const Fuse = require('fuse.js');


type IFuseOptions<T> = {
  isCaseSensitive?: boolean;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
  shouldSort?: boolean;
  location?: number;
  threshold?: number;
  distance?: number;
  useExtendedSearch?: boolean;
  findAllMatches?: boolean;
  keys?: Array<string | { name: string, weight: number }>;
  getFn?: ((obj: T, path: string | string[]) => any);
  sortFn?: ((a: { score: number }, b: { score: number }) => number);
};

type Item = {
  item: string;
  refIndex: number;
  score: number;
};

type Options = IFuseOptions<Item>;


export default function getFuse(
  data: ReadonlyArray<string> | ReadonlyArray<Record<string, any>>,
  options: Options = {
    includeScore: true,
    threshold: 0.3,
  }
) {
  const fuse = new Fuse(data, options);

  return fuse;
}
