import { Client, IMessage, StompSubscription } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { getWsHttpUrl } from "@/config"
import { authService } from "./auth.service"
import { MessageResponse } from "@/types/api"

type MessageCallback = (message: MessageResponse) => void
type ConnectionCallback = (connected: boolean) => void

interface SendMessagePayload {
  content: string
  type: string
  chatId: string
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private messageCallbacks: Map<string, MessageCallback[]> = new Map()
  private connectionCallbacks: ConnectionCallback[] = []
  private pendingSubscriptions: Set<string> = new Set()
  private isConnected = false

  connect(): void {
    if (this.client?.connected) return

    const token = authService.getToken()
    if (!token) {
      console.error("No token for WebSocket")
      return
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(getWsHttpUrl()) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true
        this.notifyConnectionCallbacks(true)
        setTimeout(() => this.createPendingSubscriptions(), 300)
      },
      onDisconnect: () => {
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
      },
      onStompError: () => {
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
      },
      onWebSocketError: () => {
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
      },
    })

    this.client.activate()
  }

  disconnect(): void {
    this.unsubscribeAll()
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.isConnected = false
    this.notifyConnectionCallbacks(false)
  }

  subscribeToChat(chatId: string, onMessage: MessageCallback): () => void {
    if (!this.client) this.connect()

    const subscriptionKey = `chat.${chatId}`
    if (!this.messageCallbacks.has(subscriptionKey)) {
      this.messageCallbacks.set(subscriptionKey, [])
    }
    this.messageCallbacks.get(subscriptionKey)!.push(onMessage)

    if (this.client?.connected) {
      this.createChatSubscription(chatId, subscriptionKey)
    } else {
      this.pendingSubscriptions.add(subscriptionKey)
    }

    return () => this.unsubscribeFromChat(chatId, onMessage)
  }

  private createChatSubscription(chatId: string, subscriptionKey: string): void {
    if (this.subscriptions.has(subscriptionKey) || !this.client?.connected) return

    const subscription = this.client.subscribe(`/topic/chat.${chatId}`, (message: IMessage) => {
      try {
        const messageData: MessageResponse = JSON.parse(message.body)
        ;(this.messageCallbacks.get(subscriptionKey) || []).forEach((cb) => cb(messageData))
      } catch (error) {
        console.error("WS parse error:", error)
      }
    })

    this.subscriptions.set(subscriptionKey, subscription)
    this.pendingSubscriptions.delete(subscriptionKey)
  }

  private createPendingSubscriptions(): void {
    this.pendingSubscriptions.forEach((key) => {
      this.createChatSubscription(key.replace("chat.", ""), key)
    })
  }

  unsubscribeFromChat(chatId: string, onMessage: MessageCallback): void {
    const subscriptionKey = `chat.${chatId}`
    const callbacks = (this.messageCallbacks.get(subscriptionKey) || []).filter((cb) => cb !== onMessage)
    if (callbacks.length === 0) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
      this.messageCallbacks.delete(subscriptionKey)
    } else {
      this.messageCallbacks.set(subscriptionKey, callbacks)
    }
  }

  sendMessage(chatId: string, message: SendMessagePayload): void {
    if (!this.client?.connected) {
      console.error("WebSocket not connected")
      return
    }
    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ content: message.content, type: message.type, chatId }),
    })
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback)
    callback(this.isConnected)
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback)
    }
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected))
  }

  private unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions.clear()
    this.messageCallbacks.clear()
  }

  getConnected(): boolean {
    return this.isConnected && this.client?.connected === true
  }
}

export const webSocketService = new WebSocketService()
