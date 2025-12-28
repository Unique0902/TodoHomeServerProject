const mongoose = require('mongoose');

// 준비물 서브도큐먼트 스키마
const ProjectItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isPurchased: { type: Boolean, default: false },
  price: { type: Number, default: null }, // null이면 가격 미입력
}, { _id: true }); // 각 아이템에 고유 ID 부여

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'wish'],
      default: 'active',
    },
    items: { type: [ProjectItemSchema], default: [] }, // 준비물 배열
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
