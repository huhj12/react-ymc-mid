const connectDB = require('./_lib/mongodb');
const Score = require('./_lib/Score');

const LEADERBOARD_LIMIT = 10;

async function getTopScores() {
  return Score.find().sort({ score: -1, createdAt: 1 }).limit(LEADERBOARD_LIMIT);
}

module.exports = async (req, res) => {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const scores = await getTopScores();
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      const score = Number(req.body.score);

      if (!name) {
        res.status(400).json({ message: '이름을 입력하세요.' });
        return;
      }

      if (!Number.isFinite(score) || score < 0) {
        res.status(400).json({ message: '유효한 점수가 아닙니다.' });
        return;
      }

      const saved = await Score.create({
        name: name.slice(0, 20),
        score: Math.floor(score),
      });

      const leaderboard = await getTopScores();

      res.status(201).json({
        saved,
        leaderboard,
        isTopTen: leaderboard.some((entry) => String(entry._id) === String(saved._id)),
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
    return;
  }

  res.status(405).json({ message: 'Method not allowed' });
};
