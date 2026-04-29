import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { playerNames = ['玩家', '东家', '南家', '西家'] } = req.body;
    
    const gameId = uuidv4();
    const now = new Date().toISOString();
    
    const gameData = {
      id: gameId,
      status: 'waiting',
      currentPlayer: 0,
      round: 0,
      dealer: 0,
      players: playerNames.map((name, index) => ({
        id: index,
        name,
        hand: [],
        melds: [],
        discards: [],
        score: 0,
        isDealer: index === 0
      })),
      wall: [],
      deadWall: [],
      lastAction: null,
      actionHistory: []
    };
    
    db.run(
      'INSERT INTO games (id, created_at, updated_at, game_data) VALUES (?, ?, ?, ?)',
      [gameId, now, now, JSON.stringify(gameData)]
    );
    
    res.json({ success: true, game: gameData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(
      'SELECT game_data FROM games WHERE id = ?',
      [req.params.id]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ success: false, error: '牌局不存在' });
    }
    
    const gameData = JSON.parse(result[0].values[0][0]);
    res.json({ success: true, game: gameData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { game } = req.body;
    const now = new Date().toISOString();
    
    db.run(
      'UPDATE games SET game_data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(game), now, req.params.id]
    );
    
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/replay', async (req, res) => {
  try {
    const db = getDatabase();
    const { replayData } = req.body;
    const gameId = req.params.id;
    const replayId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      'INSERT INTO replays (id, game_id, created_at, replay_data) VALUES (?, ?, ?, ?)',
      [replayId, gameId, now, JSON.stringify(replayData)]
    );
    
    res.json({ success: true, replayId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/replay', async (req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec(
      'SELECT replay_data FROM replays WHERE game_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ success: false, error: '回放不存在' });
    }
    
    const replayData = JSON.parse(result[0].values[0][0]);
    res.json({ success: true, replay: replayData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
