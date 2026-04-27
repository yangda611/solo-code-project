import React, { useState, useEffect } from 'react';
import useStore from '../store';
import api from '../services/api';

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 380,
    height: '100%',
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    backdropFilter: 'blur(10px)',
    borderLeft: '1px solid rgba(100, 150, 255, 0.3)',
    overflowY: 'auto',
    padding: 20,
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    zIndex: 1000
  },
  
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '1px solid rgba(100, 150, 255, 0.3)'
  },
  
  title: {
    color: '#66ccff',
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    letterSpacing: 1
  },
  
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 0
  },
  
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(30, 30, 50, 0.5)',
    borderRadius: 8,
    border: '1px solid rgba(100, 150, 255, 0.15)'
  },
  
  sectionTitle: {
    color: '#88ddff',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(100, 150, 255, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: 5,
    display: 'block',
    fontWeight: 500
  },
  
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(40, 40, 70, 0.8)',
    border: '1px solid rgba(100, 150, 255, 0.3)',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 13,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  
  select: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(40, 40, 70, 0.8)',
    border: '1px solid rgba(100, 150, 255, 0.3)',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 13,
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  
  button: {
    width: '100%',
    padding: '12px 20px',
    backgroundColor: 'rgba(100, 180, 255, 0.3)',
    border: '1px solid rgba(100, 180, 255, 0.5)',
    borderRadius: 6,
    color: '#88ddff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8
  },
  
  primaryButton: {
    backgroundColor: 'rgba(0, 200, 100, 0.4)',
    borderColor: 'rgba(0, 200, 100, 0.6)',
    color: '#88ffaa'
  },
  
  dangerButton: {
    backgroundColor: 'rgba(255, 80, 80, 0.3)',
    borderColor: 'rgba(255, 80, 80, 0.5)',
    color: '#ff8888'
  },
  
  row: {
    display: 'flex',
    gap: 10,
    marginBottom: 12
  },
  
  col: {
    flex: 1
  },
  
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  successBadge: {
    backgroundColor: 'rgba(0, 255, 100, 0.2)',
    color: '#88ffaa',
    border: '1px solid rgba(0, 255, 100, 0.4)'
  },
  
  warningBadge: {
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    color: '#ffdd88',
    border: '1px solid rgba(255, 200, 0, 0.4)'
  },
  
  errorBadge: {
    backgroundColor: 'rgba(255, 80, 80, 0.2)',
    color: '#ff8888',
    border: '1px solid rgba(255, 80, 80, 0.4)'
  },
  
  infoBadge: {
    backgroundColor: 'rgba(100, 180, 255, 0.2)',
    color: '#88ddff',
    border: '1px solid rgba(100, 180, 255, 0.4)'
  },
  
  obstacleItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: 'rgba(50, 50, 80, 0.5)',
    borderRadius: 4,
    marginBottom: 8,
    border: '1px solid rgba(100, 150, 255, 0.2)'
  },
  
  obstacleName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500
  },
  
  smallButton: {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 80, 80, 0.3)',
    border: '1px solid rgba(255, 80, 80, 0.5)',
    borderRadius: 4,
    color: '#ff8888',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default function ControlPanel() {
  const {
    armConfig,
    updateArmConfig,
    targetPoint,
    updateTargetPoint,
    obstacles,
    addObstacle,
    removeObstacle,
    clearObstacles,
    isReachable,
    hasCollision,
    collisions,
    currentPath,
    isAnimating,
    animationType,
    showPathPreview,
    showCollisionWarning,
    showTargetSnap,
    showTaskComplete,
    startAnimation,
    stopAnimation,
    showPathPreview: enablePathPreview,
    hidePathPreview: disablePathPreview,
    showCollisionWarning: enableCollisionWarning,
    hideCollisionWarning: disableCollisionWarning,
    showTargetSnap: enableTargetSnap,
    hideTargetSnap: disableTargetSnap,
    showTaskComplete: enableTaskComplete,
    hideTaskComplete: disableTaskComplete,
    setCurrentPath,
    setReachable,
    setCollisionStatus,
    resetAll
  } = useStore();
  
  const [jointCount, setJointCount] = useState(armConfig.jointCount);
  const [targetCoords, setTargetCoords] = useState(targetPoint.position);
  const [newObstacle, setNewObstacle] = useState({
    type: 'sphere',
    position: { x: 0, y: 1, z: 0 },
    radius: 0.5,
    size: { x: 1, y: 1, z: 1 },
    height: 1
  });
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  
  const handleJointCountChange = (e) => {
    const count = parseInt(e.target.value);
    setJointCount(count);
    updateArmConfig({
      jointCount: count,
      linkLengths: new Array(count).fill(1),
      angleLimits: new Array(count).fill({ min: -Math.PI, max: Math.PI })
    });
  };
  
  const handleTargetChange = (axis, value) => {
    const newCoords = { ...targetCoords, [axis]: parseFloat(value) };
    setTargetCoords(newCoords);
    updateTargetPoint(newCoords);
  };
  
  const handleNewObstacleChange = (field, value) => {
    setNewObstacle(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: parseFloat(value)
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };
  
  const handleAddObstacle = () => {
    addObstacle(newObstacle);
    setNewObstacle({
      type: 'sphere',
      position: { x: 0, y: 1, z: 0 },
      radius: 0.5,
      size: { x: 1, y: 1, z: 1 },
      height: 1
    });
  };
  
  const handleCalculatePath = async () => {
    setCalculating(true);
    setError(null);
    
    try {
      const ikResult = await api.calculateIK(armConfig, targetPoint.position);
      
      if (ikResult.success) {
        setReachable(true);
        enableTargetSnap();
        startAnimation('snap');
        
        setTimeout(() => {
          disableTargetSnap();
        }, 1000);
        
        const pathResult = await api.planPath(
          armConfig,
          new Array(armConfig.jointCount).fill(0),
          targetPoint.position,
          obstacles
        );
        
        if (pathResult.success) {
          setCurrentPath(pathResult.path);
          enablePathPreview();
          
          const collisionResult = await api.checkCollision(
            armConfig,
            pathResult.finalAngles,
            obstacles
          );
          
          setCollisionStatus(collisionResult.hasCollision, collisionResult.collisions);
          
          if (collisionResult.hasCollision) {
            enableCollisionWarning();
            startAnimation('warning');
          }
        } else if (pathResult.blocked) {
          setError('路径被障碍物阻挡，无法到达目标点');
          enableCollisionWarning();
          startAnimation('warning');
        }
      } else {
        setReachable(false);
        setError(ikResult.error || '目标点不可达');
      }
    } catch (err) {
      setError(err.message || '计算失败');
      console.error('Path calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };
  
  const handlePlayAnimation = () => {
    if (currentPath && currentPath.length > 0) {
      startAnimation('path');
    }
  };
  
  const handleCompleteAnimation = () => {
    enableTaskComplete();
    startAnimation('complete');
    
    setTimeout(() => {
      disableTaskComplete();
    }, 2000);
  };
  
  const handleReset = () => {
    resetAll();
    setError(null);
    setTargetCoords(targetPoint.position);
  };
  
  const getStatusBadge = () => {
    if (error) {
      return (
        <span style={{ ...styles.statusBadge, ...styles.errorBadge }}>
          错误
        </span>
      );
    }
    
    if (hasCollision) {
      return (
        <span style={{ ...styles.statusBadge, ...styles.warningBadge }}>
          碰撞警告
        </span>
      );
    }
    
    if (isReachable === true) {
      return (
        <span style={{ ...styles.statusBadge, ...styles.successBadge }}>
          可达
        </span>
      );
    }
    
    if (isReachable === false) {
      return (
        <span style={{ ...styles.statusBadge, ...styles.errorBadge }}>
          不可达
        </span>
      );
    }
    
    return (
      <span style={{ ...styles.statusBadge, ...styles.infoBadge }}>
        待计算
      </span>
    );
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>RoboArm PathLab</h1>
        <p style={styles.subtitle}>工业机械臂路径规划平台</p>
        <div style={{ marginTop: 10 }}>
          {getStatusBadge()}
        </div>
      </div>
      
      {error && (
        <div style={{
          ...styles.section,
          backgroundColor: 'rgba(255, 80, 80, 0.2)',
          borderColor: 'rgba(255, 80, 80, 0.4)'
        }}>
          <p style={{ color: '#ff8888', fontSize: 13, margin: 0 }}>
            ⚠️ {error}
          </p>
        </div>
      )}
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>机械臂配置</h3>
        
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>关节数量</label>
            <select
              style={styles.select}
              value={jointCount}
              onChange={handleJointCountChange}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n} 关节</option>
              ))}
            </select>
          </div>
        </div>
        
        {armConfig.linkLengths.map((length, index) => (
          <div key={index} style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>关节 {index + 1} 臂长</label>
              <input
                type="number"
                style={styles.input}
                value={length}
                step="0.1"
                min="0.1"
                onChange={(e) => {
                  const newLengths = [...armConfig.linkLengths];
                  newLengths[index] = parseFloat(e.target.value);
                  updateArmConfig({ linkLengths: newLengths });
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>目标点设置</h3>
        
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>X 坐标</label>
            <input
              type="number"
              style={styles.input}
              value={targetCoords.x}
              step="0.1"
              onChange={(e) => handleTargetChange('x', e.target.value)}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>Y 坐标</label>
            <input
              type="number"
              style={styles.input}
              value={targetCoords.y}
              step="0.1"
              onChange={(e) => handleTargetChange('y', e.target.value)}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>Z 坐标</label>
            <input
              type="number"
              style={styles.input}
              value={targetCoords.z}
              step="0.1"
              onChange={(e) => handleTargetChange('z', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>障碍物配置</h3>
        
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>类型</label>
            <select
              style={styles.select}
              value={newObstacle.type}
              onChange={(e) => handleNewObstacleChange('type', e.target.value)}
            >
              <option value="sphere">球体</option>
              <option value="box">立方体</option>
              <option value="cylinder">圆柱体</option>
            </select>
          </div>
        </div>
        
        <div style={styles.row}>
          <div style={styles.col}>
            <label style={styles.label}>位置 X</label>
            <input
              type="number"
              style={styles.input}
              value={newObstacle.position.x}
              step="0.1"
              onChange={(e) => handleNewObstacleChange('position.x', e.target.value)}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>Y</label>
            <input
              type="number"
              style={styles.input}
              value={newObstacle.position.y}
              step="0.1"
              onChange={(e) => handleNewObstacleChange('position.y', e.target.value)}
            />
          </div>
          <div style={styles.col}>
            <label style={styles.label}>Z</label>
            <input
              type="number"
              style={styles.input}
              value={newObstacle.position.z}
              step="0.1"
              onChange={(e) => handleNewObstacleChange('position.z', e.target.value)}
            />
          </div>
        </div>
        
        {newObstacle.type === 'sphere' && (
          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>半径</label>
              <input
                type="number"
                style={styles.input}
                value={newObstacle.radius}
                step="0.1"
                min="0.1"
                onChange={(e) => handleNewObstacleChange('radius', e.target.value)}
              />
            </div>
          </div>
        )}
        
        {newObstacle.type === 'box' && (
          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>宽度</label>
              <input
                type="number"
                style={styles.input}
                value={newObstacle.size.x}
                step="0.1"
                min="0.1"
                onChange={(e) => handleNewObstacleChange('size.x', e.target.value)}
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>高度</label>
              <input
                type="number"
                style={styles.input}
                value={newObstacle.size.y}
                step="0.1"
                min="0.1"
                onChange={(e) => handleNewObstacleChange('size.y', e.target.value)}
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>深度</label>
              <input
                type="number"
                style={styles.input}
                value={newObstacle.size.z}
                step="0.1"
                min="0.1"
                onChange={(e) => handleNewObstacleChange('size.z', e.target.value)}
              />
            </div>
          </div>
        )}
        
        {newObstacle.type === 'cylinder' && (
          <>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>半径</label>
                <input
                  type="number"
                  style={styles.input}
                  value={newObstacle.radius}
                  step="0.1"
                  min="0.1"
                  onChange={(e) => handleNewObstacleChange('radius', e.target.value)}
                />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>高度</label>
                <input
                  type="number"
                  style={styles.input}
                  value={newObstacle.height}
                  step="0.1"
                  min="0.1"
                  onChange={(e) => handleNewObstacleChange('height', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
        
        <button
          style={styles.button}
          onClick={handleAddObstacle}
        >
          + 添加障碍物
        </button>
        
        {obstacles.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <label style={styles.label}>已添加的障碍物 ({obstacles.length})</label>
            {obstacles.map((obstacle) => (
              <div key={obstacle.id} style={styles.obstacleItem}>
                <span style={styles.obstacleName}>
                  {obstacle.type === 'sphere' ? '球体' : 
                   obstacle.type === 'box' ? '立方体' : '圆柱体'}
                </span>
                <button
                  style={styles.smallButton}
                  onClick={() => removeObstacle(obstacle.id)}
                >
                  删除
                </button>
              </div>
            ))}
            
            <button
              style={{ ...styles.button, ...styles.dangerButton, marginTop: 10 }}
              onClick={clearObstacles}
            >
              清除所有障碍物
            </button>
          </div>
        )}
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>操作控制</h3>
        
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={handleCalculatePath}
          disabled={calculating || isAnimating}
        >
          {calculating ? '计算中...' : '计算可达性 & 规划路径'}
        </button>
        
        {currentPath && currentPath.length > 0 && (
          <button
            style={styles.button}
            onClick={handlePlayAnimation}
            disabled={isAnimating}
          >
            {isAnimating && animationType === 'path' ? '动画播放中...' : '播放运动动画'}
          </button>
        )}
        
        {isReachable === true && !hasCollision && (
          <button
            style={styles.button}
            onClick={handleCompleteAnimation}
            disabled={isAnimating}
          >
            触发完成动画
          </button>
        )}
        
        <button
          style={{ ...styles.button, ...styles.dangerButton }}
          onClick={handleReset}
        >
          重置所有
        </button>
      </div>
      
      {collisions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>碰撞详情</h3>
          {collisions.map((collision, index) => (
            <div key={index} style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 80, 80, 0.15)',
              borderRadius: 4,
              marginBottom: 8,
              borderLeft: '3px solid #ff4444'
            }}>
              <p style={{ color: '#ff8888', fontSize: 12, margin: 0 }}>
                <strong>连杆 {collision.linkIndex + 1}</strong> 与障碍物碰撞
                <br />
                穿透深度: {collision.penetration.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
