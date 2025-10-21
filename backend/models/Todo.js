const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    // 기한 (날짜와 시간 통합)
    dueDate: { type: Date, required: false },
    // 연결된 프로젝트 ID (참조용 String)
    projectId: { type: String, required: false },
  },
  { timestamps: true }
); // createdAt, updatedAt 자동 관리

module.exports = mongoose.model('Todo', TodoSchema);
