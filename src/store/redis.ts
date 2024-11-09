import type { RedisClientType } from 'redis'
import { createClient } from 'redis';

import config from "../config";


export class RedisStore {
    private redisClient: RedisClientType

    async init() {
        this.redisClient = createClient({ url: config.redisUri })

        this.redisClient.on('error', (err: Error) => console.log('Redis Client Error', err))

        await this.redisClient.connect()

        return this
    }

    isOpen() {
        return this.redisClient?.isOpen
    }

    async pubsub() {
        return {
            publisher: await this.redisClient.duplicate().connect(),
            subscriber: await this.redisClient.duplicate().connect()
        }
    }

    async close() {
        await this.redisClient.quit()
    }

    async setValue(key: string, value: any, options: { noExpiration?: boolean } = {}) {
        await this.redisClient.set(
            key,
            JSON.stringify(value),
            { EX: options.noExpiration ? undefined : config.redisExpiry }
        )
    }

    async getValue(key: string) {
        const result = await this.redisClient.get(key)
        return JSON.parse(result)
    }

    async delValue(key: string | string[]) {
        /* Unlink does not block */
        await this.redisClient.unlink(key)
    }

    async addToSet(key: string, value: string) {
        await this.redisClient.sAdd(key, value)
        await this.redisClient.expire(key, config.redisExpiry)
    }

    async countSetItems(key: string) {
        return this.redisClient.sCard(key)
    }

    async delSetItem(key: string, value: string) {
        await this.redisClient.sRem(key, value)
    }

    async getSetItems(key: string) {
        return this.redisClient.sMembers(key)
    }

    /*
     * Redis does not support full regex patterns in KEYS or SCAN commands. It
     * supports only glob-style patterns like *, ? and [chars].
     */
    async getMatched(pattern: string) {
        const rooms = []

        const iterator = this.redisClient.scanIterator({ COUNT: 10, MATCH: pattern })
        for await (const room of iterator) {
            rooms.push(room)
        }

        let values = []
        if (rooms.length) {
            values = await this.redisClient.mGet(rooms)
        }

        return values.map(val => JSON.parse(val))
    }
}


export default new RedisStore
