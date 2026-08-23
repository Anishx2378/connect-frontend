import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    const token = Cookies.get('token')
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000', {
      auth: { token },
      autoConnect: false, // We will connect manually after login
    })
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) {
    s.auth = { token: Cookies.get('token') }
    s.connect()
  }
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
