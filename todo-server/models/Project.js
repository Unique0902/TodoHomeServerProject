const mongoose = require('mongoose');

// 준비물 서브도큐먼트 스키마
const ProjectItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isPurchased: { type: Boolean, default: false },
  price: { type: Number, default: null }, // null이면 가격 미입력
}, { _id: true }); // 각 아이템에 고유 ID 부여

// URL 서브도큐먼트 스키마
const ProjectUrlSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
}, { _id: true }); // 각 URL에 고유 ID 부여

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
    urls: { type: [ProjectUrlSchema], default: [] }, // URL 배열
    parentProjectId: { type: String, required: false }, // 상위 프로젝트 ID (하위 프로젝트인 경우)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);
