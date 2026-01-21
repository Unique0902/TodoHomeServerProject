const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    // 실행일 (날짜와 시간 통합) - 기존 필드
    dueDate: { type: Date, required: false },
    // 기한 - 시작 날짜/시간
    startDate: { type: Date, required: false },
    // 기한 - 마감 날짜/시간
    endDate: { type: Date, required: false },
    // 연결된 프로젝트 ID (참조용 String)
    projectId: { type: String, required: false },
    // 완료된 날짜 (기한이 없는 할일의 경우 완료 날짜 저장)
    completedDate: { type: Date, required: false },
  },
  { timestamps: true }
); // createdAt, updatedAt 자동 관리

module.exports = mongoose.model('Todo', TodoSchema);
