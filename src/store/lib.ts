import { isMobilePhone } from 'validator'


export class StoreLib {
  static isUrl = {
    isUrl: {
      msg: 'needs to be valid url'
    }
  }

  static isMobilePhone = {
      isMobilePhone(value: string) {
          const ok = isMobilePhone(
              value,
              ['en-US', 'en-CA', 'en-IN', 'en-GB', 'pt-BR'],
              { strictMode: true }
          )

          if (!ok)
              throw new Error('Not a valid phone number')
      }
  }

  static isEmail = {
    isEmail: {
      msg: 'needs to be valid email'
    }
  }
}


export default new StoreLib
