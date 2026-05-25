import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useInformantSession } from '../session/InformantSession'

const CUSTOMER_VIEWERS_WS_URL = 'ws://localhost:8080/ws/customer-viewers'

export type CustomerViewer = {
  userID: string
  informantName: string
  customerID: number
}

type CustomerViewersContextValue = {
  viewers: CustomerViewer[]
  getCustomerViewers: (customerID: number) => CustomerViewer[]
  notifyCustomerView: (customerID: number) => void
  notifyCustomerLeave: () => void
}

const CustomerViewersContext =
  createContext<CustomerViewersContextValue | null>(null)

export function useCustomerViewers() {
  const context = useContext(CustomerViewersContext)

  if (!context) {
    throw new Error('useCustomerViewers must be used within CustomerViewersProvider')
  }

  return context
}

export function CustomerViewersProvider({ children }: { children: ReactNode }) {
  const { informantName, userID } = useInformantSession()
  const [viewers, setViewers] = useState<CustomerViewer[]>([])
  const socketRef = useRef<WebSocket | null>(null)
  const currentCustomerIDRef = useRef<number | null>(null)

  const sendCustomerView = useCallback(
    (customerID: number) => {
      const socket = socketRef.current

      if (!informantName || socket?.readyState !== WebSocket.OPEN) {
        return
      }

      socket.send(
        JSON.stringify({
          userID,
          informantName,
          customerID,
        }),
      )
    },
    [informantName, userID],
  )

  const notifyCustomerView = useCallback(
    (customerID: number) => {
      currentCustomerIDRef.current = customerID
      sendCustomerView(customerID)
    },
    [sendCustomerView],
  )

  const notifyCustomerLeave = useCallback(() => {
    const socket = socketRef.current

    if (socket?.readyState !== WebSocket.OPEN) {
      currentCustomerIDRef.current = null
      return
    }

    socket.send(
      JSON.stringify({
        type: 'leave',
        userID,
      }),
    )
    currentCustomerIDRef.current = null
  }, [userID])

  const getCustomerViewers = useCallback(
    (customerID: number) =>
      viewers.filter(
        (viewer) =>
          viewer.customerID === customerID && viewer.userID !== userID,
      ),
    [userID, viewers],
  )

  useEffect(() => {
    if (!informantName) {
      return undefined
    }

    const socket = new WebSocket(CUSTOMER_VIEWERS_WS_URL)
    socketRef.current = socket

    socket.addEventListener('open', () => {
      if (currentCustomerIDRef.current !== null) {
        sendCustomerView(currentCustomerIDRef.current)
      }
    })

    socket.addEventListener('message', (event) => {
      try {
        const nextViewers = JSON.parse(event.data) as CustomerViewer[]
        setViewers(Array.isArray(nextViewers) ? nextViewers : [])
      } catch {
        setViewers([])
      }
    })

    socket.addEventListener('close', () => {
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    })

    return () => {
      socket.close()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [informantName, sendCustomerView])

  const contextValue = useMemo(
    () => ({
      viewers,
      getCustomerViewers,
      notifyCustomerView,
      notifyCustomerLeave,
    }),
    [getCustomerViewers, notifyCustomerLeave, notifyCustomerView, viewers],
  )

  return (
    <CustomerViewersContext.Provider value={contextValue}>
      {children}
    </CustomerViewersContext.Provider>
  )
}
