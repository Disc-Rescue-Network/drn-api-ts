import util from 'util'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import weekOfYear from 'dayjs/plugin/weekOfYear'


global.logObject = function (obj: any) {
  console.log(util.inspect(obj, { depth: null }))
}


dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)
