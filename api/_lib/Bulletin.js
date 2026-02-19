const mongoose = require('mongoose');

const worshipItemSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  item: { type: String, required: true },
  detail: { type: String, default: '' },
});

const scheduleItemSchema = new mongoose.Schema({
  day: { type: String, required: true },
  event: { type: String, required: true },
  time: { type: String, required: true },
});

const bulletinSchema = new mongoose.Schema({
  churchName: { type: String, required: true },
  date: { type: String, required: true },
  worshipTitle: { type: String, required: true },
  sermonTitle: { type: String, required: true },
  scripture: { type: String, required: true },
  pastor: { type: String, required: true },
  orderOfWorship: [worshipItemSchema],
  announcements: [String],
  weeklySchedule: [scheduleItemSchema],
  footerAddress: { type: String, default: '' },
  footerContact: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.Bulletin || mongoose.model('Bulletin', bulletinSchema);
