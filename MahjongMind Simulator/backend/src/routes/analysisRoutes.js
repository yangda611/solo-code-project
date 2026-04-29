import { Router } from 'express';
import { analyzeHand, calculateWaitingTiles, calculateFan } from '../mahjong/analysis.js';

const router = Router();

router.post('/waiting', async (req, res) => {
  try {
    const { hand, melds = [], isSelfDrawn = false } = req.body;
    
    const result = calculateWaitingTiles(hand, melds);
    
    res.json({ 
      success: true, 
      waitingTiles: result.waitingTiles,
      canHu: result.canHu,
      analysis: result.analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/fan', async (req, res) => {
  try {
    const { hand, melds = [], winningTile, isSelfDrawn = false, isLastTile = false, isRobKong = false } = req.body;
    
    const result = calculateFan(hand, melds, winningTile, {
      isSelfDrawn,
      isLastTile,
      isRobKong
    });
    
    res.json({ 
      success: true, 
      totalFan: result.totalFan,
      fanDetails: result.fanDetails,
      isValidHu: result.isValidHu
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/best-discard', async (req, res) => {
  try {
    const { hand, melds = [], wall, discards = [] } = req.body;
    
    const analysis = analyzeHand(hand, melds, wall, discards);
    
    res.json({ 
      success: true, 
      bestDiscard: analysis.bestDiscard,
      options: analysis.options,
      currentWaiting: analysis.currentWaiting
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
