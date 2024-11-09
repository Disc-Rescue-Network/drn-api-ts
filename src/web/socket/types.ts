import WebSocket from 'ws';


export interface WebSocketMessage {
    eventName: string,
    roomId?: string,
    id?: string;
    uid?: string;
    env: Record<string, any>,
    profile: Record<string, any>,
    closed?: boolean,
}

export interface Room {
    id: string
    name: string
}

export interface RoomConnection<T> {
    [key: string]: { [key: string]: T extends WebSocket ? T : WebSocket }
}
