import { Client, IMessage, StompSubscription } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { authService } from "./auth.service"
import { MessageResponse } from "@/types/api"

type MessageCallback = (message: MessageResponse) => void

interface SendMessagePayload {
  content: string
  type: string
  chatId: string
}
type TypingCallback = (userId: string) => void
type ConnectionCallback = (connected: boolean) => void

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private messageCallbacks: Map<string, MessageCallback[]> = new Map()
  private typingCallbacks: Map<string, TypingCallback[]> = new Map()
  private connectionCallbacks: ConnectionCallback[] = []
  private pendingSubscriptions: Set<string> = new Set()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  private getWebSocketUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
    const baseUrl = apiUrl.replace("/api", "")
    return `${baseUrl}/ws`
  }

  connect(): void {
    if (this.client?.connected) {
      return
    }

    const token = authService.getToken()
    if (!token) {
      console.error("No token available for WebSocket connection")
      return
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.getWebSocketUrl()) as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("STOMP:", str)
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WEBSOCKET] ✅ WebSocket connected")
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnectionCallbacks(true)
        setTimeout(() => {
          console.log("[WEBSOCKET] Creating pending subscriptions after connect")
          this.createPendingSubscriptions()
        }, 500)
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected")
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame)
        this.isConnected = false
        this.notifyConnectionCallbacks(false)
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event)
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
    console.log(`[WEBSOCKET] subscribeToChat called for chatId: ${chatId}`)
    
    if (!this.client) {
      console.log(`[WEBSOCKET] Client not exists, connecting...`)
      this.connect()
    }

    const subscriptionKey = `chat.${chatId}`
    console.log(`[WEBSOCKET] Subscription key: ${subscriptionKey}`)
    
    if (!this.messageCallbacks.has(subscriptionKey)) {
      this.messageCallbacks.set(subscriptionKey, [])
    }
    this.messageCallbacks.get(subscriptionKey)!.push(onMessage)
    console.log(`[WEBSOCKET] Callbacks for ${subscriptionKey}:`, this.messageCallbacks.get(subscriptionKey)?.length)

    if (this.client?.connected) {
      console.log(`[WEBSOCKET] Client connected, creating subscription immediately`)
      this.createChatSubscription(chatId, subscriptionKey)
    } else {
      console.log(`[WEBSOCKET] Client not connected, adding to pending subscriptions`)
      this.pendingSubscriptions.add(subscriptionKey)
    }

    return () => {
      console.log(`[WEBSOCKET] Unsubscribing from chat ${chatId}`)
      this.unsubscribeFromChat(chatId, onMessage)
    }
  }

  private createChatSubscription(chatId: string, subscriptionKey: string): void {
    if (this.subscriptions.has(subscriptionKey)) {
      console.log(`Subscription already exists for ${subscriptionKey}`)
      return
    }
    
    if (!this.client?.connected) {
      console.error(`Cannot create subscription: WebSocket not connected for chat ${chatId}`)
      return
    }

    const destination = `/topic/chat.${chatId}`
    console.log(`[WEBSOCKET] Creating subscription to: ${destination}, key: ${subscriptionKey}`)
    console.log(`[WEBSOCKET] Client connected: ${this.client.connected}, client exists: ${!!this.client}`)

    try {
      const subscription = this.client.subscribe(
        destination,
        (message: IMessage) => {
          console.log(`[WEBSOCKET] MESSAGE RECEIVED on ${destination}`)
          console.log(`[WEBSOCKET] Raw message body:`, message.body)
          console.log(`[WEBSOCKET] Message headers:`, message.headers)
          try {
            const messageData: MessageResponse = JSON.parse(message.body)
            console.log(`[WEBSOCKET] Parsed message:`, messageData)
            const callbacks = this.messageCallbacks.get(subscriptionKey) || []
            console.log(`[WEBSOCKET] Callbacks count: ${callbacks.length}`)
            if (callbacks.length === 0) {
              console.warn(`[WEBSOCKET] No callbacks registered for chat ${chatId}`)
            }
            callbacks.forEach((callback) => {
              console.log(`[WEBSOCKET] Calling callback for chat ${chatId}`)
              callback(messageData)
            })
          } catch (error) {
            console.error(`[WEBSOCKET] Error parsing message:`, error, message.body)
          }
        },
        {
          id: subscriptionKey,
        }
      )

      if (subscription) {
        this.subscriptions.set(subscriptionKey, subscription)
        this.pendingSubscriptions.delete(subscriptionKey)
        console.log(`[WEBSOCKET] ✅ Successfully subscribed to ${destination}`)
        console.log(`[WEBSOCKET] Active subscriptions:`, Array.from(this.subscriptions.keys()))
      } else {
        console.error(`[WEBSOCKET] ❌ Failed to create subscription for ${destination}`)
      }
    } catch (error) {
      console.error(`[WEBSOCKET] ❌ Error creating subscription for chat ${chatId}:`, error)
    }
  }

  private createPendingSubscriptions(): void {
    if (process.env.NODE_ENV === "development") {
      console.log("Creating pending subscriptions:", Array.from(this.pendingSubscriptions))
    }
    this.pendingSubscriptions.forEach((subscriptionKey) => {
      const chatId = subscriptionKey.replace("chat.", "")
      this.createChatSubscription(chatId, subscriptionKey)
    })
  }

  unsubscribeFromChat(chatId: string, onMessage: MessageCallback): void {
    const subscriptionKey = `chat.${chatId}`
    const callbacks = this.messageCallbacks.get(subscriptionKey) || []
    const filteredCallbacks = callbacks.filter((cb) => cb !== onMessage)
    
    if (filteredCallbacks.length === 0) {
      const subscription = this.subscriptions.get(subscriptionKey)
      if (subscription) {
        subscription.unsubscribe()
        this.subscriptions.delete(subscriptionKey)
      }
      this.messageCallbacks.delete(subscriptionKey)
    } else {
      this.messageCallbacks.set(subscriptionKey, filteredCallbacks)
    }
  }

  subscribeToTyping(chatId: string, onTyping: TypingCallback): () => void {
    if (!this.client?.connected) {
      this.connect()
    }

    const subscriptionKey = `typing.${chatId}`
    
    if (!this.typingCallbacks.has(subscriptionKey)) {
      this.typingCallbacks.set(subscriptionKey, [])
    }
    this.typingCallbacks.get(subscriptionKey)!.push(onTyping)

    if (!this.subscriptions.has(subscriptionKey)) {
      const subscription = this.client?.subscribe(
        `/topic/chat.${chatId}.typing`,
        (message: IMessage) => {
          try {
            const userId = message.body
            const callbacks = this.typingCallbacks.get(subscriptionKey) || []
            callbacks.forEach((callback) => callback(userId))
          } catch (error) {
            console.error("Error parsing typing message:", error)
          }
        }
      )

      if (subscription) {
        this.subscriptions.set(subscriptionKey, subscription)
      }
    }

    return () => {
      this.unsubscribeFromTyping(chatId, onTyping)
    }
  }

  unsubscribeFromTyping(chatId: string, onTyping: TypingCallback): void {
    const subscriptionKey = `typing.${chatId}`
    const callbacks = this.typingCallbacks.get(subscriptionKey) || []
    const filteredCallbacks = callbacks.filter((cb) => cb !== onTyping)
    
    if (filteredCallbacks.length === 0) {
      const subscription = this.subscriptions.get(subscriptionKey)
      if (subscription) {
        subscription.unsubscribe()
        this.subscriptions.delete(subscriptionKey)
      }
      this.typingCallbacks.delete(subscriptionKey)
    } else {
      this.typingCallbacks.set(subscriptionKey, filteredCallbacks)
    }
  }

  sendMessage(chatId: string, message: SendMessagePayload): void {
    if (!this.client?.connected) {
      console.error("WebSocket not connected")
      return
    }

    const payload = {
      content: message.content,
      type: message.type,
      chatId: chatId,
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Sending message via WebSocket:", payload)
    }

    this.client.publish({
      destination: `/app/chat.send`,
      body: JSON.stringify(payload),
    })
  }

  sendTyping(chatId: string): void {
    if (!this.client?.connected) {
      return
    }

    this.client.publish({
      destination: `/app/chat.typing`,
      body: chatId,
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
    this.connectionCallbacks.forEach((callback) => callback(connected))
  }

  private unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    this.messageCallbacks.clear()
    this.typingCallbacks.clear()
  }

  getConnected(): boolean {
    return this.isConnected && this.client?.connected === true
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  logStatus(): void {
    console.log("[WEBSOCKET] Status:", {
      connected: this.getConnected(),
      subscriptions: this.getActiveSubscriptions(),
      pendingSubscriptions: Array.from(this.pendingSubscriptions),
      callbacks: Array.from(this.messageCallbacks.keys()),
    })
  }
}

export const webSocketService = new WebSocketService()
