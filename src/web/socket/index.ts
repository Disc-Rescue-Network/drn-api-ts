import WebSocket from 'ws'

import controller from './controller'
import { ExtWebSocket } from './service'


Object.defineProperty(WebSocket.prototype, 'setKeepAlive', {
    configurable: false,
    writable: false,
    value: ExtWebSocket.prototype.setKeepAlive,
})


export default controller
