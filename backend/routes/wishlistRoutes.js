const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// /api/v1/wishlists 경로에 대한 라우팅
router
  .route('/')
  .get(wishlistController.getAllWishlists) // GET /api/v1/wishlists
  .post(wishlistController.createWishlist); // POST /api/v1/wishlists (위시 생성)

// /api/v1/wishlists/:id 경로에 대한 라우팅
router
  .route('/:id')
  .get(wishlistController.getWishlist) // GET /api/v1/wishlists/:id (단일 조회)
  .patch(wishlistController.updateWishlistPartial) // PATCH /api/v1/wishlists/:id (부분 수정, 예: isCompleted)
  .put(wishlistController.updateWishlistFull) // PUT /api/v1/wishlists/:id (전체 교체)
  .delete(wishlistController.deleteWishlist); // DELETE /api/v1/wishlists/:id (삭제)

module.exports = router;
