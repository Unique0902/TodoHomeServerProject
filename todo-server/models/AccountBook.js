const mongoose = require('mongoose');

// 사고 싶은 것 서브도큐먼트 스키마
const WishItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true }, // 가격은 필수 (예산 계산을 위해)
  isPurchased: { type: Boolean, default: false },
}, { _id: true }); // 각 아이템에 고유 ID 부여

const AccountBookSchema = new mongoose.Schema(
  {
    totalAsset: { type: Number, default: 0 }, // 총 재산 (현금 기준)
    wishItems: { type: [WishItemSchema], default: [] }, // 사고 싶은 것들 리스트
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccountBook', AccountBookSchema);

