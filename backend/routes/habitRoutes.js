const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');

// /api/v1/habits 경로에 대한 라우팅
router
  .route('/')
  .get(habitController.getAllHabits) // GET /api/v1/habits?categoryId=... (목록 조회 및 필터링)
  .post(habitController.createHabit); // POST /api/v1/habits (습관 생성)

// **[새로운 커스텀 엔드포인트 추가]**
router.post('/reset-completions', habitController.resetCompletions); // POST /api/v1/habits/reset-completions

// /api/v1/habits/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(habitController.getHabit) // GET /api/v1/habits/:id (단일 조회)
  .patch(habitController.updateHabit) // PATCH /api/v1/habits/:id (부분 수정 및 배열 수정)
  .put(habitController.updateHabitFull) // PUT /api/v1/habits/:id (전체 교체)
  .delete(habitController.deleteHabit); // DELETE /api/v1/habits/:id (삭제)

module.exports = router;
