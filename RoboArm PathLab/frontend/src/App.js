import React, { useEffect, useState } from 'react';
import ThreeScene from './components/ThreeScene';
import ControlPanel from './components/ControlPanel';
import useStore from './store';

const App = () => {
  const {
    isAnimating,
    showCollisionWarning,
    showTargetSnap,
    showTaskComplete
  } = useStore();
  
  const [showNotification, setShowNotification] = useState(null);
  
  useEffect(() => {
    if (showCollisionWarning) {
      setShowNotification({
        type: 'warning',
        message: '⚠️ 检测到碰撞！请调整目标点或障碍物位置。'
      });
    } else if (showTargetSnap) {
      setShowNotification({
        type: 'info',
        message: '🎯 目标点已吸附！'
      });
    } else if (showTaskComplete) {
      setShowNotification({
        type: 'success',
        message: '✅ 任务完成！机械臂已成功到达目标位置。'
      });
    } else if (!isAnimating) {
      const timer = setTimeout(() => {
        setShowNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCollisionWarning, showTargetSnap, showTaskComplete, isAnimating]);
  
  const getNotificationStyle = (type) => {
    const baseStyle = {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 420,
      padding: '15px 20px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      zIndex: 2000,
      animation: 'slideIn 0.3s ease-out',
      backdropFilter: 'blur(10px)'
    };
    
    switch (type) {
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 170, 0, 0.2)',
          border: '2px solid rgba(255, 170, 0, 0.6)',
          color: '#ffdd88',
          boxShadow: '0 0 20px rgba(255, 170, 0, 0.3)'
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0, 255, 100, 0.2)',
          border: '2px solid rgba(0, 255, 100, 0.6)',
          color: '#88ffaa',
          boxShadow: '0 0 20px rgba(0, 255, 100, 0.3)'
        };
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 180, 255, 0.2)',
          border: '2px solid rgba(100, 180, 255, 0.6)',
          color: '#88ddff',
          boxShadow: '0 0 20px rgba(100, 180, 255, 0.3)'
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#0a0a0f',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse-warning {
            0%, 100% { box-shadow: 0 0 10px rgba(255, 170, 0, 0.3); }
            50% { box-shadow: 0 0 30px rgba(255, 170, 0, 0.8); }
          }
          
          @keyframes pulse-success {
            0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 100, 0.3); }
            50% { box-shadow: 0 0 30px rgba(0, 255, 100, 0.8); }
          }
        `}
      </style>
      
      <ThreeScene />
      
      <ControlPanel />
      
      {showNotification && (
        <div style={getNotificationStyle(showNotification.type)}>
          {showNotification.message}
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <p style={{ margin: 0 }}>鼠标左键: 旋转视角 | 鼠标中键: 平移 | 鼠标滚轮: 缩放</p>
      </div>
    </div>
  );
};

export default App;
