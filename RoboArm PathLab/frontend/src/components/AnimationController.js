import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useStore from '../store';

export default function AnimationController() {
  const {
    isAnimating,
    animationType,
    currentPath,
    pathProgress,
    setPathProgress,
    updateJointAngles,
    stopAnimation,
    showCollisionWarning,
    showTargetSnap,
    showTaskComplete
  } = useStore();
  
  const animationStateRef = useRef({
    startTime: 0,
    duration: 0,
    startAngles: null,
    endAngles: null,
    animationPhase: 'idle'
  });
  
  useEffect(() => {
    if (isAnimating) {
      const state = animationStateRef.current;
      state.startTime = performance.now();
      
      if (animationType === 'path' && currentPath && currentPath.length > 0) {
        state.animationPhase = 'path_movement';
        state.duration = currentPath.length * 50;
        state.startAngles = [...currentPath[0].jointAngles];
        state.endAngles = [...currentPath[currentPath.length - 1].jointAngles];
      } else if (animationType === 'snap') {
        state.animationPhase = 'snap';
        state.duration = 500;
      } else if (animationType === 'complete') {
        state.animationPhase = 'complete';
        state.duration = 2000;
      } else if (animationType === 'warning') {
        state.animationPhase = 'warning';
        state.duration = 1000;
      }
    } else {
      animationStateRef.current.animationPhase = 'idle';
    }
  }, [isAnimating, animationType, currentPath]);
  
  useFrame((state, delta) => {
    if (!isAnimating) return;
    
    const animState = animationStateRef.current;
    const currentTime = performance.now();
    const elapsed = currentTime - animState.startTime;
    const progress = Math.min(elapsed / animState.duration, 1);
    
    switch (animState.animationPhase) {
      case 'path_movement':
        if (currentPath && currentPath.length > 0) {
          const pathIndex = Math.floor(progress * (currentPath.length - 1));
          const currentStep = currentPath[Math.min(pathIndex, currentPath.length - 1)];
          
          if (currentStep) {
            updateJointAngles([...currentStep.jointAngles]);
            setPathProgress(progress);
          }
        }
        
        if (progress >= 1) {
          stopAnimation();
        }
        break;
        
      case 'snap':
        if (progress >= 1) {
          stopAnimation();
        }
        break;
        
      case 'complete':
        if (progress >= 1) {
          stopAnimation();
        }
        break;
        
      case 'warning':
        if (progress >= 1) {
          stopAnimation();
        }
        break;
        
      default:
        break;
    }
  });
  
  return null;
}
