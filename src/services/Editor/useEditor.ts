import {reactive, readonly} from "vue";
import { Client } from "@stomp/stompjs";
import { IMapObject } from "../streetplaner/IMapObject";

const ws_url = `ws://${window.location.host}/stomp`
const DEST = '/topic/public'
const SEND_MSG = '/app/editor.sendMessage'
const CREATE_MSG = '/app/editor.create'
const DELETE_MSG = '/app/editor.delete'
const UPDATE_MSG = '/app/editor.update'
const MAP_API = '/api/map/objects/'

let stompClient: Client

interface IEditorState {
    objectList: IMapObject[],
    errormessage: string,
    mapId: number,
    userName: string
}

interface IStompMessage {
    id: number
    type: string,
    author: string,
    content: IMapObject
}

const editorState = reactive<IEditorState>({
    objectList: Array<IMapObject>(),
    errormessage: '',
    mapId: 0,
    userName: ''
})

export function useEditor(mapId: number) {
    editorState.mapId = mapId

    return {
        mapObjects: readonly(editorState),
        createMessage,
        deleteMessage,
        updateMessage,
        updateMap,
        receiveEditorUpdates
    }
}

function updateMap() {
    if (editorState.mapId === 0) {
        editorState.errormessage = 'Invalid mapId'
    } else {
        fetch(MAP_API + editorState.mapId)
            .then((resp) => {
                if (!resp.ok) {
                    throw new Error(resp.statusText)
                }
                return resp.json()
            })
            .then((jsonData: IMapObject[]) => {
                editorState.objectList = jsonData
            })
            .catch((reason) => {
                editorState.errormessage = `Error: ${reason}`
            })
    }
}

function receiveEditorUpdates() {
    updateMap();

    stompClient = new Client({ brokerURL: ws_url });
    stompClient.onWebSocketError = (error) => { editorState.errormessage = error.message };
    stompClient.onStompError = (frame) => { editorState.errormessage = frame.body };

    stompClient.onConnect = (frame) => {
        console.log("connected");
        stompClient.subscribe(DEST, (message) => {
            const editorUpdate: IStompMessage = JSON.parse(message.body);
            onMessageReceived(editorUpdate);
        })
    }
    stompClient.onDisconnect = () => {
        console.log("disconnected");
    }

    stompClient.activate();
}

function createMessage(message: IMapObject) {
    if (message && stompClient) {
        const editorMessage: IStompMessage = {
            id: editorState.mapId,
            type: 'CREATE',
            author: editorState.userName,
            content: message            
        }
        stompClient.publish({
            destination: CREATE_MSG,
            headers: {},
            body: JSON.stringify(editorMessage)
        })
    }
}

function deleteMessage(message: IMapObject) {
    if (message && stompClient) {
        const editorMessage: IStompMessage = {
            id: editorState.mapId,
            type: 'DELETE',
            author: editorState.userName,
            content: message            
        }

        stompClient.publish({
            destination: DELETE_MSG,
            headers: {},
            body: JSON.stringify(editorMessage)
        })
    }
}

function updateMessage(message: IMapObject) {
    if (message && stompClient) {
        const editorMessage: IStompMessage = {
            id: editorState.mapId,
            type: 'UPDATE',
            author: editorState.userName,
            content: message
        }

        stompClient.publish({
            destination: UPDATE_MSG,
            headers: {},
            body: JSON.stringify(editorMessage)
        })
    }
}

function onMessageReceived(payload: IStompMessage) {
    console.log(payload);
    if (editorState.mapId === payload.id) {
        if (payload.type === 'CREATE') {
            editorState.objectList.push(payload.content)
        } else if (payload.type === 'DELETE') {
            editorState.objectList = editorState.objectList.filter(
                (obj) => obj.objectTypeId != payload.content.objectTypeId)
        } else if (payload.type === 'UPDATE') {
            editorState.objectList.forEach((obj, index) => {
                if (obj.objectTypeId === payload.content.objectTypeId) {
                    editorState.objectList[index] = payload.content
                }
            })
        }
    }
}