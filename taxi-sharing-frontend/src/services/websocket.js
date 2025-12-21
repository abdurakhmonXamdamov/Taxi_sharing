import { WS_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; 
    this.reconnectDelay = 3000;
    this.listeners = new Map();
  }

  // Connect to WebSocket
  async connect() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        console.log('⚠️ No token found, skipping WebSocket connection');
        return;
      }

      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
      }

      // Create WebSocket connection
      const wsUrl = `${WS_URL}/ws/location/?token=${token}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 WebSocket message:', data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (e) => {
        console.log("⚠️ WebSocket error:", e.message);
      };
      
      this.ws.onclose = (e) => {
        console.log("🔌 WebSocket closed:", e.code, e.reason);
        this.handleReconnect();
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }

  // Handle reconnection
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.log('❌ Max reconnection attempts reached');
    }
  }

  // Send message through WebSocket
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.log('⚠️ WebSocket not connected, cannot send message');
    }
  }

  // Subscribe to WebSocket messages
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify all listeners of an event
  notifyListeners(data) {
    const { type } = data;
    
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        callback(data);
      });
    }
    
    // Also notify 'all' listeners
    if (this.listeners.has('all')) {
      this.listeners.get('all').forEach(callback => {
        callback(data);
      });
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  // Check connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export default new WebSocketService();
