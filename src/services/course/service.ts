import { Op } from 'sequelize'

import Course from './models/course'


export class CourseService {
    init () {
        return this
    }

    findAll = async (orgCodes: string[]) => {
        const where: {} = {}

        if (orgCodes && orgCodes.length)
            where['orgCode'] = { [Op.in]: orgCodes }

        return Course.findAll({
            where,
            raw: true,
            nest: true
        })
    }
}


export default new CourseService
