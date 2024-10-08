import { io, Socket } from 'socket.io-client'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react'
import { useAuthContext } from '../hooks/context/useAuthContext'

export type TSocketContextType = {
  socket: Socket | null
  onlineUsers: string[]
  typing?: boolean
  setTyping?: Dispatch<SetStateAction<boolean>>
  typingInfo?: { userId: string; roomId: string }
  setTypingInfo?: Dispatch<SetStateAction<{ userId: string; roomId: string }>>
}

const initialSocketContext: TSocketContextType = {
  socket: null,
  onlineUsers: [],
}

export const SocketContext =
  createContext<TSocketContextType>(initialSocketContext)

const SocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typing, setTyping] = useState<boolean>(false)
  const [typingInfo, setTypingInfo] = useState<{
    userId: string
    roomId: string
  }>()
  const { authUser } = useAuthContext()

  //connect socket
  useEffect(() => {
    if (authUser) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL as string, {
        query: {
          userId: authUser._id,
        },
      })

      setSocket(newSocket)

      newSocket.on('connect', () => {
        console.log('Socket connected')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      newSocket.on('error', () => {
        console.log('Socket error: ')
      })

      return () => {
        newSocket.close()
      }
    } else {
      socket?.disconnect()
      setSocket(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  //get online users
  useEffect(() => {
    if (!socket) return

    socket.on('getOnlineUsers', (users: string[]) => {
      setOnlineUsers(users)
    })
  }, [socket])

  //typing listeners
  useEffect(() => {
    socket?.on(
      'typingReceived',
      ({ userId, roomId }: { userId: string; roomId: string }) => {
        console.log('typingReceived', userId, roomId)
        if (userId !== authUser?._id) {
          setTyping(true)
          setTypingInfo({ userId, roomId })
        }
      }
    )

    socket?.on('stopTypingReceived', (userId: string) => {
      if (userId !== authUser?._id) {
        setTyping(false)
        setTypingInfo(undefined)
      }
    })

    return () => {
      socket?.off('typingReceived')
      socket?.off('stopTypingReceived')
    }
  }, [socket, authUser])

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typing,
        setTyping,
        typingInfo,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContextProvider
