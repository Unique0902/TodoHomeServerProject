const mongoose = require('mongoose');

const HabitCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // 습관을 실천/선택한 날짜 배열 (배열 안전 수정 로직 적용 예정)
    selectedDates: { type: [Date], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HabitCategory', HabitCategorySchema);
