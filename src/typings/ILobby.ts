import { E_LobbyMode } from "./E_LobbyMode"
import { IPlayerListItem } from "./IPlayerListItem"

export interface ILobby {
    lobbyName:string
    numOfPlayers: number
    lobbyMode: E_LobbyMode
    host?:string
    playerList?: IPlayerListItem[]
}