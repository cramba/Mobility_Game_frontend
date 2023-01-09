import { computed, reactive, onMounted, readonly } from "vue"
import User from "../typings/IUser"
import { E_LobbyMode } from "../typings/E_LobbyMode"
import { ILobby } from "../typings/ILobby"
import { IGetPlayerResponseDTO } from "../typings/IGetPlayerResponseDTO"

const state = reactive<User>({
    userId: 0, //as IGetPlayerResponseDTO["userId"],
    userName: "", // as IGetPlayerResponseDTO["userName"],
    errormessage: "",
    loggedIn: false,
    activeLobby: {
        lobbyId: -1,
        mapId: -1,
        hostId: -1,
        lobbyName: "",
        numOfPlayers: 0,
        lobbyModeEnum: E_LobbyMode.BUILD_MODE,
    },
})

const userAsJsonString = computed(() => JSON.stringify(state))

function retrieveUserFromLocalStorage(): User | null {
    const userJsonString = localStorage.getItem("user")
    if (userJsonString) {
        return JSON.parse(userJsonString)
    }
    return null
}

async function sendName(): Promise<void> {
    const response = await fetch("/api/player", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userName: state.userName,
        }),
    })

    console.log("sendName():", response)
    const jsondata = await response.json()
    state.userId = Number(jsondata)
    console.log("state.userId", state.userId)
}

function setActiveLobby(lobby: ILobby) {
    state.activeLobby.hostId = lobby.hostId
    state.activeLobby.lobbyId = lobby.lobbyId
    state.activeLobby.mapId = lobby.mapId
    state.activeLobby.lobbyModeEnum = lobby.lobbyModeEnum
    state.activeLobby.lobbyName = lobby.lobbyName
    state.activeLobby.numOfPlayers = lobby.numOfPlayers
    console.log(lobby)
    console.log(state)
    postActiveLobby(lobby)
}

async function postActiveLobby(lobby: ILobby) {
    const response = await fetch(
        `/api/lobby/get_players/${lobby.lobbyId}?player_id=${state.userId}`,
        {
            method: "POST",
        }
    )
    console.log("setActiveLobby() -> post player to lobby - response", response)
}

async function register(username: string, password: string): Promise<any> {
    return fetch("/api/player", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            userName: username as IGetPlayerResponseDTO["userName"],
            password: password,
        }),
    })
        .then((response) => {
            if (response.status === 200 || response.status === 400) {
                return response.json()
            } else {
                return null
            }
        })
        .then((data) => {
            return data
        })
        .catch((err) => console.log(err))
}

async function login(
    username: string,
    password: string
): Promise<{ userId: number; userName: string } | null> {
    return fetch("/api/player/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            userName: username as IGetPlayerResponseDTO["userName"],
            password: password,
        }),
    })
        .then((response) => {
            if (response.status === 200 || response.status === 400) {
                return response.json()
            } else {
                return null
            }
        })
        .then((data) => {
            console.log(data)
            if (data != null) {
                const loginDataResponse: IGetPlayerResponseDTO = data
                state.userName = loginDataResponse.userName
                state.userId = loginDataResponse.userId
                state.errormessage = ""
                state.loggedIn = true
                console.log(state)
                localStorage.setItem("user", userAsJsonString.value)
            }
            return data
        })
        .catch((err) => {
            state.loggedIn = false
            state.errormessage = err
            console.log(state.errormessage)
        })
}

const logout = () => {
    state.loggedIn = false
    state.activeLobby = {
        lobbyId: -1,
        mapId: -1,
        lobbyName: "",
        numOfPlayers: 0,
        lobbyModeEnum: E_LobbyMode.BUILD_MODE,
    }
    state.userId = 0
    state.errormessage = ""
    localStorage.removeItem("user")
    console.log("Test")
    console.log(state)
}

export default function useUser() {
    onMounted(() => {
        const storedUser = retrieveUserFromLocalStorage()
        if (storedUser) {
            state.userId = storedUser.userId
            state.userName = storedUser.userName
            state.errormessage = storedUser.errormessage
            state.loggedIn = true
            state.activeLobby = storedUser.activeLobby
        }
    })

    return {
        logindata: readonly(state),
        sendName,
        setActiveLobby,
        login,
        logout,
        register,
    }
}
