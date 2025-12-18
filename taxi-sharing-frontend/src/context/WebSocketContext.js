import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/websocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      // Connect when user is logged in
      WebSocketService.connect();
      
      // Subscribe to all messages
      const unsubscribe = WebSocketService.subscribe('all', (data) => {
        setLastMessage(data);
      });

      // Check connection status
      const checkConnection = setInterval(() => {
        setIsConnected(WebSocketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(checkConnection);
        unsubscribe();
        WebSocketService.disconnect();
      };
    }
  }, [isLoggedIn]);

  const sendMessage = (message) => {
    WebSocketService.send(message);
  };

  const subscribe = (eventType, callback) => {
    return WebSocketService.subscribe(eventType, callback);
  };

  return (
    <WebSocketContext.Provider 
      value={{ 
        isConnected, 
        lastMessage, 
        sendMessage, 
        subscribe 
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;