// import React, { createContext, useContext, useEffect, useState } from 'react';
// import WebSocketService from '../services/websocket';
// import { useAuth } from './AuthContext';

// const WebSocketContext = createContext();

// export const WebSocketProvider = ({ children }) => {
//   const { isLoggedIn } = useAuth(); // ✅ Check if user is logged in
//   const [isConnected, setIsConnected] = useState(false);
//   const [lastMessage, setLastMessage] = useState(null);

//   useEffect(() => {
//     // ✅ Only connect if user is logged in
//     if (isLoggedIn) {
//       console.log('✅ User logged in, connecting WebSocket...');
//       WebSocketService.connect();
      
//       const unsubscribe = WebSocketService.subscribe('all', (data) => {
//         setLastMessage(data);
//       });

//       const checkConnection = setInterval(() => {
//         setIsConnected(WebSocketService.isConnected());
//       }, 1000);

//       return () => {
//         clearInterval(checkConnection);
//         unsubscribe();
//         WebSocketService.disconnect();
//       };
//     } else {
//       console.log('⚠️ User not logged in, skipping WebSocket connection');
//       // Disconnect if user logs out
//       WebSocketService.disconnect();
//       setIsConnected(false);
//     }
//   }, [isLoggedIn]); // ✅ Reconnect when login status changes

//   const sendMessage = (message) => {
//     WebSocketService.send(message);
//   };

//   const subscribe = (eventType, callback) => {
//     return WebSocketService.subscribe(eventType, callback);
//   };

//   return (
//     <WebSocketContext.Provider 
//       value={{ 
//         isConnected, 
//         lastMessage, 
//         sendMessage, 
//         subscribe 
//       }}
//     >
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (!context) {
//     throw new Error('useWebSocket must be used within WebSocketProvider');
//   }
//   return context;
// };

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
      console.log('✅ User logged in, connecting WebSocket...');
      
      // Connect
      WebSocketService.connect();
      
      // Subscribe to all messages
      const unsubscribe = WebSocketService.subscribe('all', (data) => {
        console.log('📨 WebSocketContext received message:', data);
        setLastMessage(data);
      });

      // Check connection status every second
      const checkConnection = setInterval(() => {
        const connected = WebSocketService.isConnected();
        setIsConnected(connected);
      }, 1000);

      // Cleanup on unmount or logout
      return () => {
        console.log('🧹 Cleaning up WebSocket...');
        clearInterval(checkConnection);
        unsubscribe();
        WebSocketService.disconnect();
      };
    } else {
      console.log('⚠️ User not logged in, skipping WebSocket');
      WebSocketService.disconnect();
      setIsConnected(false);
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