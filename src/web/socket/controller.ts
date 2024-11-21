import http from 'http';

import { Request, Response, NextFunction } from 'express';

import socketService from './service';

import AppController from '../../lib/app-controller';


export class SocketController extends AppController {
    async init(server: http.Server) {
        this.basePath = '/ws'

        await socketService.init(server)

        this.router.get('/debug', this.debugInfo)
        this.router.post('/room', this.createRoom)
        this.router.get('/room', this.getRooms)
        this.router.put('/room/:id', this.updateRoom)
        this.router.delete('/room/:id', this.removeRoom)

        return this
    }

    debugInfo = AppController.asyncHandler(
        async () => {
            return socketService.debugInfo()
        }
    )

    createRoom = AppController.asyncHandler(
        async (req: Request) => {
            return socketService.createRoom(req.body)
        }
    )

    getRooms = AppController.asyncHandler(
        async () => {
            return socketService.getRooms()
        }
    )

    updateRoom = AppController.asyncHandler(
        async (req: Request) => {
            return socketService.updateRoom(req.params.id, req.body)
        }
    )

    removeRoom = AppController.asyncHandler(
        async (req: Request) => {
            return socketService.removeRoom(req.params.id)
        }
    )
}


export default new SocketController
