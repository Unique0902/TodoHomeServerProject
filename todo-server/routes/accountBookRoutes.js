const express = require('express');
const router = express.Router();
const accountBookController = require('../controllers/accountBookController');

// 가계부 조회 및 총 재산 업데이트
router
  .route('/')
  .get(accountBookController.getAccountBook) // GET /api/v1/accountbook (가계부 조회)
  .patch(accountBookController.updateTotalAsset); // PATCH /api/v1/accountbook (총 재산 업데이트)

// 사고 싶은 것 관련 라우팅
router.post('/items', accountBookController.addWishItem); // POST /api/v1/accountbook/items (항목 추가)
router.patch('/items/:itemId', accountBookController.updateWishItem); // PATCH /api/v1/accountbook/items/:itemId (항목 수정)
router.delete('/items/:itemId', accountBookController.deleteWishItem); // DELETE /api/v1/accountbook/items/:itemId (항목 삭제)

module.exports = router;

