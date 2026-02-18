const express = require('express');
const router = express.Router();
const Bulletin = require('../models/Bulletin');

// 주보 조회 (가장 최근 주보 1개)
router.get('/', async (req, res) => {
  try {
    const bulletin = await Bulletin.findOne().sort({ createdAt: -1 });
    if (!bulletin) {
      return res.status(404).json({ message: '주보 데이터가 없습니다.' });
    }
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 주보 생성
router.post('/', async (req, res) => {
  try {
    const bulletin = new Bulletin(req.body);
    const saved = await bulletin.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 주보 수정
router.put('/:id', async (req, res) => {
  try {
    const updated = await Bulletin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: '주보를 찾을 수 없습니다.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
