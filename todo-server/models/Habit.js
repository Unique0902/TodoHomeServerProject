const mongoose = require('mongoose');

// URL 서브도큐먼트 스키마
const HabitUrlSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
}, { _id: true }); // 각 URL에 고유 ID 부여

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
    urls: { type: [HabitUrlSchema], default: [] }, // URL 배열
    order: { type: Number, default: 0 }, // 순서 필드
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', HabitSchema);
