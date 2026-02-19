const connectDB = require('../_lib/mongodb');
const Bulletin = require('../_lib/Bulletin');

module.exports = async (req, res) => {
  await connectDB();

  if (req.method === 'PUT') {
    try {
      const updated = await Bulletin.findByIdAndUpdate(req.query.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: '주보를 찾을 수 없습니다.' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }

  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
