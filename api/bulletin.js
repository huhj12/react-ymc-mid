const connectDB = require('./_lib/mongodb');
const Bulletin = require('./_lib/Bulletin');

module.exports = async (req, res) => {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const bulletin = await Bulletin.findOne().sort({ createdAt: -1 });
      if (!bulletin) return res.status(404).json({ message: '주보 데이터가 없습니다.' });
      res.json(bulletin);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }

  } else if (req.method === 'POST') {
    try {
      const bulletin = new Bulletin(req.body);
      const saved = await bulletin.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
