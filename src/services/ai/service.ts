import type { FuseResultMatch, FuseResult } from 'fuse.js'
import Fuse from 'fuse.js'

import brandService from '../brands/service'
import discService from '../discs/service'

import vision from "./vision/vision";


export class AIService {
    getMatchedText = (searchResult: FuseResult<FuseResultMatch>[]) => {
        const matches = []

        searchResult.forEach(res => {
            matches.push({
                matches: res.matches,
                score: res.score
            })
        })

        matches.sort(function(a, b) {
            return (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0);
        })

        const matchedTo = []
        matches[0]?.matches.forEach((match: FuseResultMatch) => {
            matchedTo.push(match.value)
        })

        return matchedTo[0]
    }

    extractImageText = async (imageData: string) => {
        var visionResponse: any = await vision.getImageText(imageData)

        const brands = await brandService.findAll();

        const words: { word: string }[] = visionResponse.data.text.words

        const fuseOptions = {
            includeScore: true,
            threshold: 0.2,
            distance: 30,
            location: 0,
            includeMatches: true,
            keys: ['MoldName', 'BrandName']
        }

        var fuse: Fuse<any> = new Fuse(<any>brands, fuseOptions)
        words.forEach(word => {
            const result = fuse.search(word.word)

            const matchedTo = this.getMatchedText(result)
            if (matchedTo)
                word['matchedTo'] = [matchedTo]

            if (result.length)
                word['category'] = ['Brand']
        })

        const discs = await discService.findAll()

        var fuse: Fuse<any> = new Fuse(<any>discs, fuseOptions)
        words.forEach(word => {
            const result = fuse.search(word.word)

            const matchedTo = this.getMatchedText(result)
            if (matchedTo) {
                if (!word['matchedTo'])
                    word['matchedTo'] = []

                if (!word['matchedTo'].includes(matchedTo))
                    word['matchedTo'].push(matchedTo)
            }

            if (result.length) {
                if (word['category'])
                    word['category'].push('Disc')
                else
                    word['category'] = ['Disc']
            }
        })

        const phoneNumberPatterns = [
            /* (123) */
            /^\(\d{3}\)/,

            // 123-
            /\d{3}\-/,

            // -456
            /\-\d{3}/,

            // -4566
            /\-\d{4}/,
        ]

        words.forEach(word => {
            /*
             * If matches anything not allowed in phone number, ignore
             */
            if (/[^\-\d\(\)]{1}/.test(word.word)) {
                return
            }

            for (const pnp of phoneNumberPatterns) {
                if (pnp.test(word.word)) {
                    word['category'] = ['PhoneNumber']
                    break
                }
            }
        })

        return { data: visionResponse.data }
    }
}


export default new AIService
