import mysql from './mysql'
import redisStore from './redis'

import { AsyncFunction } from '../lib/types'


export class Store {
    private users: {[key: string]: AsyncFunction} = {}

    async init() {
        await mysql.init()
        await redisStore.init()

        return this
    }

    async registerCallback(key: string, callback: AsyncFunction) {
        return this.users[key] = callback
    }

    async pubsub() {
        return redisStore.pubsub()
    }

    async close() {
        for (const callback of Object.values(this.users)) {
            await callback()
        }
    }

    async setValue(key: string | number, value: any, options?: { noExpiration?: boolean }) {
        return redisStore.setValue(String(key), value, options)
    }

    async getValue(key: string | number) {
        return redisStore.getValue(String(key))
    }

    async delValue(key: string | number) {
        return redisStore.delValue(String(key))
    }

    async delManyValues(keys: string[] | number[]) {
        if (keys.length)
            return redisStore.delValue(keys.map((k: string | number) => String(k)))
    }

    async addToSet(key: string | number, value: string | number) {
        return redisStore.addToSet(String(key), String(value))
    }

    async countSetItems(key: string | number) {
        return redisStore.countSetItems(String(key))
    }

    async delSetItem(key: string | number, value: string | number) {
        return redisStore.delSetItem(String(key), String(value))
    }

    async getSetItems(key: string | number) {
        return redisStore.getSetItems(String(key))
    }

    async getMatched(pattern: string) {
        return redisStore.getMatched(pattern)
    }
}


export default new Store
