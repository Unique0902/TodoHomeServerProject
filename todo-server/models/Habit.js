const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    // 연결된 Habit Category ID
    habitCategoryId: { type: String, required: true },
    // 연결된 Project ID (선택적)
    projectId: { type: String, required: false },
    // 습관을 완료한 날짜 배열
    completedDates: { type: [Date], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', HabitSchema);
