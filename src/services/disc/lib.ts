import Disc from './models/disc'


export class DiscLib {
    findAll = async () => {
        return Disc.findAll({
            raw: true,
            nest: true
        })
    }
}


export default new DiscLib
