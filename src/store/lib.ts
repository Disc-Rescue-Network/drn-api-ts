import { isMobilePhone } from 'validator'


export class StoreLib {
  static isUrl = {
    isUrl: {
      msg: 'needs to be valid url'
    }
  }

  static isMobilePhone = {
      isMobilePhone(value: string) {
          return isMobilePhone(value, ['en-US', 'en-CA'])
      }
  }

  static isEmail = {
    isEmail: {
      msg: 'needs to be valid email'
    }
  }
}


export default new StoreLib
