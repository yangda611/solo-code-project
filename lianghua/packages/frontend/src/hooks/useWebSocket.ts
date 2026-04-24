import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

const WS_URL = 'ws://localhost:8080/ws';

export function useWebSocket() {
  const { 
    setConnected, 
    setTick, 
    setKline, 
    addLog, 
    addPosition, 
    updateOrder,
    setAccount,
  } = useStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'tick':
        setTick(message.data);
        break;
      case 'kline':
        setKline(message.data);
        break;
      case 'trade':
        addLog(`[TRADE] ${message.data.side.toUpperCase()} ${message.data.quantity} @ ${message.data.price}`);
        break;
      case 'order_update':
        updateOrder(message.data);
        addLog(`[ORDER] ${message.data.id}: ${message.data.status}`);
        break;
      case 'position_update':
        addPosition(message.data);
        break;
      case 'account_update':
        setAccount((prev) => prev ? { ...prev, ...message.data } : null);
        break;
      case 'scenario_event':
        const eventTypes: Record<string, string> = {
          price_jump: '价格跳变',
          volatility_spike: '波动激增',
          liquidity_drain: '流动性枯竭',
          market_halt: '市场暂停',
        };
        addLog(`[SCENARIO] ${eventTypes[message.data.type] || message.data.type}: ${JSON.stringify(message.data.parameters)}`);
        break;
      case 'pong':
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [setTick, setKline, updateOrder, addPosition, setAccount, addLog]);

  const connect = useCallback(() => {
    if (isConnectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    isConnectingRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      isConnectingRef.current = false;
      setConnected(true);
      addLog('[SYSTEM] WebSocket connected');
      ws.send(JSON.stringify({ type: 'subscribe' }));
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      setConnected(false);
      addLog('[SYSTEM] WebSocket disconnected');
      
      if (wsRef.current === ws) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      isConnectingRef.current = false;
      addLog(`[ERROR] WebSocket error`);
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };
  }, [setConnected, addLog, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect, send };
}
