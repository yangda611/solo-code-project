import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import './App.css';

const cardEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];

const App = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [matchedAnimationCards, setMatchedAnimationCards] = useState([]);

  const initializeGame = useCallback(() => {
    const shuffledCards = [...cardEmojis, ...cardEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
    setIsChecking(false);
    setMatchedAnimationCards([]);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (matchedPairs.length / 2 === cardEmojis.length && matchedPairs.length > 0) {
      setTimeout(() => setGameWon(true), 800);
    }
  }, [matchedPairs]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [first, second] = flippedCards;
      
      if (cards[first].emoji === cards[second].emoji) {
        setMatchedAnimationCards([first, second]);
        
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, first, second]);
          setMatchedAnimationCards([]);
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
      
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  const handleCardClick = (index) => {
    if (
      isChecking ||
      flippedCards.includes(index) ||
      matchedPairs.includes(index) ||
      flippedCards.length >= 2
    ) {
      return;
    }

    setFlippedCards(prev => [...prev, index]);
  };

  return (
    <div className="app">
      <div className="game-header">
        <h1>记忆翻牌配对游戏</h1>
        <div className="game-info">
          <span>步数: {moves}</span>
          <span>配对: {matchedPairs.length / 2} / {cardEmojis.length}</span>
          <button onClick={initializeGame} className="reset-btn">
            重新开始
          </button>
        </div>
      </div>
      
      <div className="game-container">
        <div className="cards-grid">
          {cards.map((card, index) => (
            <Card
              key={card.id}
              index={index}
              emoji={card.emoji}
              isFlipped={flippedCards.includes(index)}
              isMatched={matchedPairs.includes(index)}
              isMatchedAnimating={matchedAnimationCards.includes(index)}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </div>
      </div>

      {gameWon && (
        <div className="win-modal">
          <div className="win-content">
            <h2>🎉 恭喜获胜！🎉</h2>
            <p>你用了 {moves} 步完成游戏</p>
            <button onClick={initializeGame} className="play-again-btn">
              再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
