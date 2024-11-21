import http, { IncomingMessage } from 'http'
import url from 'url'

import WebSocket, { WebSocketServer } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import type { RedisClientType } from 'redis'
import type { JwtPayload } from 'jsonwebtoken'

import { Room, RoomConnection, WebSocketMessage } from './types'

import store from '../../store'
import config from '../../config'

import { BadRequest, NotFound, ConflictError } from '../../lib/error'
import { decodeToken } from '../../lib/auth'


export class ExtWebSocket extends WebSocket {
    uid: string

    private keepAliveInterval: number;
    private keepAliveTimeout: number;
    private keepAliveIntervalId: NodeJS.Timeout;
    private keepAliveTimeoutId: NodeJS.Timeout;

    setKeepAlive(interval: number = 2000, timeout: number = 10000) {
        const self = this

        this.keepAliveInterval = interval
        this.keepAliveTimeout = timeout
        this.keepAliveTimeoutId = ping(this, this.keepAliveTimeout)
        this.keepAliveIntervalId = null

        this.on('pong', onPong)
        this.on('close', remove)

        function onPong() {
            clearTimeout(self.keepAliveTimeoutId)
            self.keepAliveIntervalId = setTimeout(function() {
                self.keepAliveTimeoutId = ping(self, self.keepAliveTimeout)
            }, self.keepAliveInterval)
        }

        function ping(ws: WebSocket, timeout: number) {
            ws.ping()

            /*
             * On close events are fired when closing after timeout. So cleanup
             * in those functions will be performed.
             */
            return setTimeout(ws.close.bind(ws), timeout)
        }

        function remove() {
            if (typeof self.keepAliveTimeoutId == 'object') {
                clearTimeout(self.keepAliveTimeoutId)
            }

            if (typeof self.keepAliveIntervalId == 'object') {
                clearTimeout(self.keepAliveIntervalId)
            }

            self.removeListener('pong', onPong)
            self.removeListener('close', remove)
        }
    }
}


export class SocketService {
    private wss: WebSocketServer

    private publisher: RedisClientType
    private subscriber: RedisClientType

    private newRoomChannel: string
    private readonly conns: RoomConnection<ExtWebSocket> = {}

    async init(server: http.Server) {
        store.registerCallback('socket-cleanup', this.cleanup)

        const pubsub = await store.pubsub();
        this.publisher = pubsub.publisher;
        this.subscriber = pubsub.subscriber;

        this.wss = new WebSocketServer({ server })
        this.wss.on('connection', this.onConnection)

        await this.loadRooms()

        this.newRoomChannel = `<${config.serviceName}>room`

        await this.subscriber.subscribe(this.newRoomChannel, async (message: string) => {
            const room: Room = JSON.parse(message)
            await this.initRoom([room])
        })

        return this
    }

    onSend = async (err: Error) => {
        if (err)
            return console.error(err)
    }

    onConnection = async (ws: ExtWebSocket, req: IncomingMessage) => {
        if (!req.headers.origin || !config.allowedHosts.includes(req.headers.origin))
            return ws.close(1001, 'Origin header is missing')

        const token = url.parse(req.url, true).query.token as string
        if (!token)
            return ws.close(1002, 'Auth token is missing')

        try {
            const payload = await decodeToken(token) as JwtPayload
            ws.uid = payload.sub
        } catch (err) {
            return ws.close(1003, 'Invalid or expired token')
        }

        function cleanup(ws: ExtWebSocket) {
            ws.removeListener('message', onMessage)
            ws.removeListener('error', onError)
            ws.removeListener('close', onClose)
        }

        const onError = (err: Error) => { console.error(err) }
        ws.on('error', onError);

        ws.setKeepAlive()

        const onMessage = async (data: Buffer) => {
            const message: WebSocketMessage = JSON.parse(data.toString())

            if (message.eventName == 'join') {
                if(!message.roomId)
                    return ws.send(JSON.stringify({ message: 'No room id' }), this.onSend)

                if(!this.conns[message.roomId])
                    return ws.send(JSON.stringify({ message: 'No such room' }), this.onSend)

                if (!message.profile)
                    return ws.send(JSON.stringify({ message: 'Profile is needed' }), this.onSend)

                /*
                 * If member exists in redis, its possible that the member is
                 * already connected to the room. May be not this particular
                 * instance of app but another instance.
                 *
                 * Checking for that user connection in process variables such
                 * as this.conns will not work.
                 */
                const member = await store.getValue(`<${config.serviceName}>room<${message.roomId}>member<${ws.uid}>profile`)
                if (member)
                    return ws.send(JSON.stringify({ message: 'Already in the room. If you are trying to connect from different client, disconnect that client first.' }), this.onSend)

                this.conns[message.roomId][ws.uid] = ws;

                const members = await Promise.all([
                    store.getMatched(`<${config.serviceName}>room<${message.roomId}>member<*>profile`)
                ])

                await Promise.all([
                    store.setValue(`<${config.serviceName}>room<${message.roomId}>member<${ws.uid}>profile`, { ...message.profile, uid: ws.uid })
                ])

                await this.publisher.publish(message.roomId, JSON.stringify({
                    ...message,
                    eventName: 'joined',
                    uid: ws.uid,
                }))

                ws.send(JSON.stringify({
                    ...message,
                    eventName: 'joined',
                    uid: ws.uid,
                    memberProfiles: members[0],
                }), this.onSend)
            } else if (message.eventName == 'message') {
                if (!message.roomId || !this.conns[message.roomId])
                    return

                if (!this.conns[message.roomId][ws.uid])
                    return

                await this.publisher.publish(message.roomId, JSON.stringify(<WebSocketMessage>{
                    ...message,
                    uid: ws.uid
                }))
            } else if (message.eventName == 'leave') {
                if(!this.conns[message.roomId]) return;

                if(!this.conns[message.roomId][ws.uid]) return;

                await store.delValue(`<${config.serviceName}>room<${message.roomId}>member<${ws.uid}>profile`)

                delete this.conns[message.roomId][ws.uid]

                await this.publisher.publish(message.roomId, JSON.stringify({
                    ...message,
                    eventName: 'left',
                    uid: ws.uid,
                }))
            }
        };
        ws.on('message', onMessage)

        const onClose = async () => {
            await Promise.all(Object.keys(this.conns).map(async (roomId) => {
                const room = this.conns[roomId]

                if (!room[ws.uid])
                    return

                cleanup(room[ws.uid])
                delete room[ws.uid]

                await store.delValue(`<${config.serviceName}>room<${roomId}>member<${ws.uid}>profile`),

                await this.publisher.publish(roomId, JSON.stringify(<WebSocketMessage>{
                    eventName: 'left',
                    closed: true,
                    uid: ws.uid,
                }))
            }))
        }
        ws.on('close', onClose)

        ws.send(JSON.stringify({ eventName: 'connected' }), this.onSend);
    }

    cleanup = async () => {
        /*
         * No need to remove room. But members need to go as connections will
         * not be there when app crashes/restarts and member count/list should
         * be 0/empty
         */
        await Promise.all(Object.keys(this.conns).map(async roomId => {
            const toBeDeleted: string[] = []

            for (const sock of Object.values(this.conns[roomId])) {
                toBeDeleted.push(`<${config.serviceName}>room<${roomId}>member<${sock.uid}>profile`)
            }

            await store.delManyValues(toBeDeleted)
        }))
    }

    onMessage = async (message: string, roomId: string) => {
        const msg = JSON.parse(message)

        Object.values(this.conns[roomId]).forEach(async sock => {
            const uid = sock.uid

            if (msg.eventName === 'joined' && msg.uid === uid)
                return

            sock.send(JSON.stringify(msg), (err: Error) => {
                if (err)
                    return console.error(err)

                if (msg.eventName === 'roomRemoved')
                    sock.close()
            })

            if (msg.eventName === 'roomRemoved') {
                await store.delValue(`<${config.serviceName}>room<${roomId}>member<${uid}>profile`)
            }
        })

        if (msg.eventName === 'roomRemoved') {
            await store.delValue(`<${config.serviceName}>room<${roomId}>`)

            await this.subscriber.unsubscribe(roomId)

            delete this.conns[roomId]
        }
    }

    async initRoom(rooms: Room[]) {
        rooms.map(async (room) => {
            this.conns[room.id] = {};
            await this.subscriber.subscribe(room.id, this.onMessage)
        })
    }

    async loadRooms() {
        const rooms: Room[] = await store.getMatched(`<${config.serviceName}>room<*>`)
        await this.initRoom(rooms)

        /*
         * Remove member data which the app could fail to clean during shutdown
         * if connection to redis is lost and app crashes/shutdowns. Next time
         * app starts and connects to redis, members should not be there as no
         * one has connected yet.
         */
        for (const room of rooms) {
            const members = await store.getMatched(`<${config.serviceName}>room<${room.id}>member<*>profile`)

            const toBeDeleted: string[] = []
            for (const member of members) {
                toBeDeleted.push(`<${config.serviceName}>room<${room.id}>member<${member.uid}>profile`)
            }

            await store.delManyValues(toBeDeleted)
        }
    }

    async debugInfo() {
        const rooms = await store.getMatched(`<${config.serviceName}>room<*>`)

        const profilesPerRoom = {}
        for (const room of rooms) {
            profilesPerRoom[room.id] = await store.getMatched(`<${config.serviceName}>room<${room.id}>member<*>profile`)
        }

        return {
            rooms,
            profilesPerRoom,
        }
    }

    async createRoom(data: Room, options?: { noExpiration: boolean }) {
        const id = data.id || uuidv4()

        const room = { ...data, id }

        const roomKey = `<${config.serviceName}>room<${room.id}>`

        /*
         * This check is needed as subscribing to same channel again adds
         * another listener which is not intended
         */
        if (this.conns[id])
            throw new ConflictError('Room exist already')

        await store.setValue(roomKey, room, options)

        await this.publisher.publish(this.newRoomChannel, JSON.stringify(room))

        return room
    }

    async getRooms() {
        return store.getMatched(`<${config.serviceName}>room<*>`)
    }

    async updateRoom(id: string, room: Room) {
        if (!this.conns[id])
            throw new NotFound('No such room')

        if (room.id && room.id != id)
            throw new BadRequest('Room id in payload and in path do not match')

        await store.setValue(`<${config.serviceName}>room<${id}>`, room)

        await this.publisher.publish(id, JSON.stringify({
            eventName: 'roomUpdated',
            room,
        }))

        return room
    }

    async removeRoom(id: string) {
        if (!this.conns[id])
            throw new NotFound(`There is no live room by id ${id}`)

        await this.publisher.publish(id, JSON.stringify({
            eventName: 'roomRemoved',
            roomId: id
        }))

        return { roomId: id }
    }

    async sendToRoom(roomId: string, payload: Record<string, any>) {
        const members = await store.getMatched(`<${config.serviceName}>room<${roomId}>member<*>profile`)

        members.forEach(mem => {
            this.conns[roomId][mem.uid].send(JSON.stringify(payload))
        })
    }
}


export default new SocketService;
