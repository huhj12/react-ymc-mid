const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

const LEADERBOARD_LIMIT = 10;

async function getTopScores() {
  return Score.find()
    .sort({ score: -1, createdAt: 1 })
    .limit(LEADERBOARD_LIMIT)
    .lean();
}

async function trimScores() {
  const overflow = await Score.find()
    .sort({ score: -1, createdAt: 1 })
    .skip(LEADERBOARD_LIMIT)
    .select('_id')
    .lean();

  if (overflow.length > 0) {
    await Score.deleteMany({ _id: { $in: overflow.map((entry) => entry._id) } });
  }
}

router.get('/', async (req, res) => {
  try {
    await trimScores();
    const scores = await getTopScores();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const score = Number(req.body.score);

    if (!name) {
      return res.status(400).json({ message: '이름을 입력하세요.' });
    }

    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({ message: '유효한 점수가 아닙니다.' });
    }

    const saved = await Score.create({
      name: name.slice(0, 20),
      score: Math.floor(score),
    });

    await trimScores();
    const leaderboard = await getTopScores();

    res.status(201).json({
      saved,
      leaderboard,
      isTopTen: leaderboard.some((entry) => String(entry._id) === String(saved._id)),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
