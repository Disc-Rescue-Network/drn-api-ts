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
        async (_: Request, res: Response, next: NextFunction) => {
            const result = await socketService.debugInfo()
            res.success(result, next)
        }
    )

    createRoom = AppController.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const result = await socketService.createRoom(req.body)
            res.success(result, next)
        }
    )

    getRooms = AppController.asyncHandler(
        async (_: Request, res: Response, next: NextFunction) => {
            const result = await socketService.getRooms()
            res.success(result, next)
        }
    )

    updateRoom = AppController.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const result = await socketService.updateRoom(req.params.id, req.body)
            res.success(result, next)
        }
    )

    removeRoom = AppController.asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const result = await socketService.removeRoom(req.params.id)
            res.success(result, next)
        }
    )
}


export default new SocketController
