import React, { useState, useEffect, useMemo } from 'react';
import { useGameState } from './hooks/useGameState';
import Table from './components/Table/Table';
import GameControls from './components/GameControls/GameControls';
import AnalysisPanel from './components/AnalysisPanel/AnalysisPanel';
import HuResultModal from './components/HuResultModal/HuResultModal';
import './App.css';

function App() {
  const {
    gameState,
    selectedTile,
    analysis,
    huResult,
    initGame,
    drawTile,
    discardTile,
    selectTile,
    checkHu,
    doHu,
    doPeng,
    doGang,
    doHuFromDiscard,
    skipAction,
    simulateAI,
    closeHuResult
  } = useGameState();
  
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  const handleStartGame = () => {
    initGame();
    setGameStarted(true);
  };
  
  const handleTileClick = (index, tile) => {
    if (gameState && gameState.waitingForPlayerAction) {
      return;
    }
    
    if (selectedTile === index) {
      selectTile(null);
    } else {
      selectTile(index);
    }
  };
  
  const handleDiscard = () => {
    if (selectedTile !== null && gameState) {
      discardTile(selectedTile);
      setTimeout(() => {
        simulateAI();
      }, 500);
    }
  };
  
  const handleDraw = () => {
    drawTile();
  };
  
  const handleHu = () => {
    if (gameState && gameState.waitingForPlayerAction) {
      doHuFromDiscard();
    } else if (checkHu()) {
      doHu();
    }
  };
  
  const handlePeng = () => {
    doPeng();
  };
  
  const handleGang = () => {
    doGang();
  };
  
  const handleSkip = () => {
    skipAction();
  };
  
  const availableActions = useMemo(() => {
    if (!gameState) {
      return {
        chi: false,
        peng: false,
        gang: false,
        bugang: false,
        hu: false
      };
    }
    
    if (gameState.waitingForPlayerAction && gameState.availableActions) {
      return {
        chi: false,
        peng: gameState.availableActions.some(a => a.type === 'peng'),
        gang: gameState.availableActions.some(a => a.type === 'gang'),
        bugang: false,
        hu: gameState.availableActions.some(a => a.type === 'hu')
      };
    }
    
    return {
      chi: false,
      peng: false,
      gang: false,
      bugang: false,
      hu: checkHu()
    };
  }, [gameState, checkHu]);
  
  if (!gameStarted) {
    return (
      <div className="app-container landing-page">
        <div className="landing-content">
          <h1 className="title">🀄 麻将牌局推演平台</h1>
          <p className="subtitle">创建、编辑、分析你的麻将牌局</p>
          
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">🎴</div>
              <h3>完整牌局模拟</h3>
              <p>支持摸牌、打牌、碰、杠、吃、胡完整流程</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>智能分析</h3>
              <p>实时听牌分析、进张概率计算、最优出牌建议</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>精美动画</h3>
              <p>翻转动画、滑动动画、组合动画、高亮效果</p>
            </div>
          </div>
          
          <button className="start-btn" onClick={handleStartGame}>
            开始新局
          </button>
          
          <div className="tech-info">
            <span>React + Node.js + SQLite</span>
            <span>国标麻将规则</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!gameState) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="app-container">
      <div className="game-header">
        <div className="header-title">🀄 麻将牌局推演平台</div>
        <button className="new-game-btn" onClick={handleStartGame}>
          新开一局
        </button>
      </div>
      
      <Table 
        gameState={gameState}
        onTileClick={handleTileClick}
        selectedTile={selectedTile}
      />
      
      <GameControls
        gameState={gameState}
        onDraw={handleDraw}
        onDiscard={handleDiscard}
        onChi={() => {}}
        onPeng={handlePeng}
        onGang={handleGang}
        onHu={handleHu}
        onSkip={handleSkip}
        availableActions={availableActions}
        selectedTile={selectedTile}
      />
      
      <AnalysisPanel
        analysis={analysis}
        isOpen={analysisOpen}
        onToggle={() => setAnalysisOpen(!analysisOpen)}
      />
      
      <HuResultModal
        result={huResult}
        onClose={closeHuResult}
      />
    </div>
  );
}

export default App;
