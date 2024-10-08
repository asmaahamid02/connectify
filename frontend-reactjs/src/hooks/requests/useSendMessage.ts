import { useState } from 'react'
import { sendMessageService } from '../../services/message.service'
import { useChatContext } from '../context/useChatContext'
import { useSocketContext } from '../context/useSocketContext'
import { handleError } from '../../utils/error.util'

const useSendMessage = () => {
  const [loading, setLoading] = useState(false)
  const { setMessages, updateLastMessage, selectedRoom } = useChatContext()
  const { socket } = useSocketContext()

  const sendMessage = async (roomId: string, message: string) => {
    setLoading(true)
    socket?.emit('joinRoom', selectedRoom?._id)
    try {
      const response = await sendMessageService(roomId, message)

      if ('error' in response) {
        throw new Error(response.error)
      }

      //update the last message of the room (on the sender side)
      updateLastMessage(response, false)

      //update messages array
      setMessages((prevMessages) => [...prevMessages, response])
    } catch (error: unknown) {
      handleError(error, 'Error in useSendMessage ~ sendMessage')
    } finally {
      setLoading(false)
    }
  }
  return { loading, sendMessage }
}

export default useSendMessage
