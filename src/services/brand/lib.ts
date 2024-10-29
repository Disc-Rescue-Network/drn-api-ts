import Brand from './models/brand'


export class BrandLib {
    findAll = async () => {
        return Brand.findAll({
            raw: true,
            nest: true
        })
    }
}


export default new BrandLib
