require('dotenv').config();
const express = require('express');
const connectDB = require('./db/connect');
const cors = require('cors');
const morgan = require('morgan');

// --- 1. 모든 라우트 파일 임포트 ---
const todoRoutes = require('./routes/todoRoutes');
const projectRoutes = require('./routes/projectRoutes');
const habitCategoryRoutes = require('./routes/habitCategoryRoutes');
const habitRoutes = require('./routes/habitRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const accountBookRoutes = require('./routes/accountBookRoutes');

const app = express();
const port = process.env.PORT || 5000;

// --- 2. 미들웨어 설정 ---
app.use(cors()); // 프론트엔드 연결 허용
app.use(express.json()); // JSON 요청 본문 파싱
app.use(morgan('tiny')); // 'tiny'는 간결한 로그 포맷을 의미

// --- 3. 라우팅 설정 (모든 리소스 등록) ---
// 기본 URL: /api/v1
app.use('/api/v1/todos', todoRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/habit-categories', habitCategoryRoutes);
app.use('/api/v1/habits', habitRoutes);
app.use('/api/v1/wishlists', wishlistRoutes);
app.use('/api/v1/accountbook', accountBookRoutes);

// --- 4. DB 연결 및 서버 시작 ---
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`서버가 포트 ${port}에서 실행 중입니다. MongoDB 연결 성공!`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};
// 개발 서버 실행 시에만 start() 호출
if (require.main === module) {
  start();
}

// 테스트를 위해 Express 앱 인스턴스를 export
module.exports = app;
