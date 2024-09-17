import categorize from './categorize';
import { phoneNumberRegex } from '../../../utils';
import { Category } from './categorize.model';


jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  fetcher: jest.fn()
}));

describe('categorize', () => {
  const mockImageText = {
    text: {
      confidence: 0.5,
      words: [{ word: 'testWord', confidence: 0.03 }]
    },
    colors: [
      { name: 'red', score: 0.8 },
      { name: 'blue', score: 0.5 }
    ]
  };

  let fetcherSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    fetcherSpy = jest.spyOn(require('../../../utils'), 'fetcher');
  });

  afterEach(() => {
    fetcherSpy.mockRestore();
  });

  it('should categorize phone numbers correctly', async () => {
    const spy = jest.spyOn(phoneNumberRegex, 'test').mockReturnValue(true);

    const result = await categorize.categorizeImageText(mockImageText);

    if ('data' in result) {
      expect(result.data?.text.words[0].category).toEqual(Category.PhoneNumber);
    } else {
      throw new Error('Expected data in response but found errors.');
    }

    spy.mockRestore();
  });

  it('should categorize words as Brand if found in the brand list', async () => {
    const spy = jest.spyOn(phoneNumberRegex, 'test').mockReturnValue(false);

    fetcherSpy.mockResolvedValueOnce({
      data: [{ attributes: { BrandName: 'sport' } }]
    });
    fetcherSpy.mockResolvedValueOnce({
      data: []
    });

    const mockImageText = {
      text: {
        confidence: 0.5,
        words: [{ word: 'sport', confidence: 0.03 }]
      },
      colors: [
        { name: 'red', score: 0.8 },
        { name: 'blue', score: 0.5 }
      ]
    };

    const result = await categorize.categorizeImageText(mockImageText);

    if ('data' in result) {
      expect(result.data?.text.words[0].category).toEqual(Category.Brand);
    } else {
      throw new Error('Expected data in response but found errors.');
    }

    spy.mockRestore();
  });

  it('should categorize words as Disc if found in the disc list', async () => {
    const spy = jest.spyOn(phoneNumberRegex, 'test').mockReturnValue(false);

    fetcherSpy.mockResolvedValueOnce({
      data: []
    });
    fetcherSpy.mockResolvedValueOnce({
      data: [{ attributes: { MoldName: 'johnson' } }]
    });

    const mockImageText = {
      text: {
        confidence: 0.5,
        words: [{ word: 'johnson', confidence: 0.03 }]
      },
      colors: [
        { name: 'red', score: 0.8 },
        { name: 'blue', score: 0.5 }
      ]
    };

    const result = await categorize.categorizeImageText(mockImageText);

    if ('data' in result) {
      expect(result.data?.text.words[0].category).toEqual(Category.Disc);
    } else {
      throw new Error('Expected data in response but found errors.');
    }

    spy.mockRestore();
  });

  it('should categorize as NA if no match is found', async () => {
    const spy = jest.spyOn(phoneNumberRegex, 'test').mockReturnValue(false);

    fetcherSpy.mockResolvedValueOnce({
      data: []
    });
    fetcherSpy.mockResolvedValueOnce({
      data: []
    });

    const result = await categorize.categorizeImageText(mockImageText);

    if ('data' in result) {
      expect(result.data?.text.words[0].category).toEqual(Category.NA);
    } else {
      throw new Error('Expected data in response but found errors.');
    }

    spy.mockRestore();
  });

  it('should return the color with the highest score', async () => {
    fetcherSpy.mockResolvedValueOnce({
      data: []
    });
    fetcherSpy.mockResolvedValueOnce({
      data: []
    });

    const result = await categorize.categorizeImageText(mockImageText);

    if ('data' in result) {
      expect(result.data?.colors.primary).toEqual('red');
      expect(result.data?.colors.score).toEqual(0.8);
    } else {
      throw new Error('Expected data in response but found errors.');
    }
  });

  it('should return errors array if an exception is thrown', async () => {
    fetcherSpy.mockRejectedValueOnce(new Error('API error'));

    const result = await categorize.categorizeImageText(mockImageText);

    if ('errors' in result) {
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    } else {
      throw new Error('Expected data in response but found errors.');
    }
  });
});