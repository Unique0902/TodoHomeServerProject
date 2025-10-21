const express = require('express');
const router = express.Router();
const habitCategoryController = require('../controllers/habitCategoryController');

// /api/v1/habit-categories 경로에 대한 라우팅
router
  .route('/')
  .get(habitCategoryController.getAllHabitCategories) // GET /api/v1/habit-categories (목록 조회)
  .post(habitCategoryController.createHabitCategory); // POST /api/v1/habit-categories (카테고리 생성)

// /api/v1/habit-categories/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(habitCategoryController.getHabitCategory) // GET /api/v1/habit-categories/:id (단일 조회)
  .patch(habitCategoryController.updateHabitCategory) // PATCH /api/v1/habit-categories/:id (부분 수정 및 배열 수정)
  .put(habitCategoryController.updateHabitCategoryFull) // PUT /api/v1/habit-categories/:id (전체 교체)
  .delete(habitCategoryController.deleteHabitCategory); // DELETE /api/v1/habit-categories/:id (삭제)

module.exports = router;
