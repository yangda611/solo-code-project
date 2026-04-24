import React from 'react';

const Card = ({ index, emoji, isFlipped, isMatched, isMatchedAnimating, onClick }) => {
  return (
    <div 
      className={`card-wrapper ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${isMatchedAnimating ? 'match-animation' : ''}`}
      onClick={onClick}
      data-index={index}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="question-mark">?</span>
        </div>
        <div className="card-back">
          <span className="emoji">{emoji}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;
