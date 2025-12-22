const Wishlist = require('../models/Wishlist');

// 1. 위시리스트 생성 (POST /wishlists)
exports.createWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.create(req.body);
    res.status(201).json(wishlist);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: '필수 필드(title)가 누락되었습니다.' });
    }
    res
      .status(500)
      .json({ message: '위시리스트 생성 실패', error: error.message });
  }
};

// 2. 위시리스트 목록 조회 (GET /wishlists)
exports.getAllWishlists = async (req, res) => {
  try {
    const { isCompleted } = req.query;
    let query = {};

    // isCompleted 필터링 (선택 사항)
    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted === 'true';
    }

    const wishlists = await Wishlist.find(query).sort({ createdAt: -1 });
    res.status(200).json(wishlists);
  } catch (error) {
    res
      .status(500)
      .json({ message: '위시리스트 목록 조회 실패', error: error.message });
  }
};

// 3. 단일 위시리스트 조회 (GET /wishlists/:id)
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findById(req.params.id);
    if (!wishlist) {
      return res
        .status(404)
        .json({ message: '위시리스트를 찾을 수 없습니다.' });
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res
      .status(500)
      .json({ message: '위시리스트 조회 실패', error: error.message });
  }
};

// 4. 위시리스트 부분 수정 (PATCH /wishlists/:id)
exports.updateWishlistPartial = async (req, res) => {
  try {
    const wishlist = await Wishlist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!wishlist) {
      return res
        .status(404)
        .json({ message: '위시리스트를 찾을 수 없습니다.' });
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res
      .status(400)
      .json({ message: '위시리스트 부분 수정 실패', error: error.message });
  }
};

// 5. 위시리스트 전체 수정 (PUT /wishlists/:id)
exports.updateWishlistFull = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndReplace(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!wishlist) {
      return res
        .status(404)
        .json({ message: '위시리스트를 찾을 수 없습니다.' });
    }
    res.status(200).json(wishlist);
  } catch (error) {
    res
      .status(400)
      .json({ message: '위시리스트 전체 수정 실패', error: error.message });
  }
};

// 6. 위시리스트 삭제 (DELETE /wishlists/:id)
exports.deleteWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findByIdAndDelete(req.params.id);

    if (!wishlist) {
      return res
        .status(404)
        .json({ message: '위시리스트를 찾을 수 없습니다.' });
    }
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: '위시리스트 삭제 실패', error: error.message });
  }
};
