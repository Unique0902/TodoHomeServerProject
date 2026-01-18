const AccountBook = require('../models/AccountBook');

// 1. 가계부 조회 (단일 인스턴스만 존재, 없으면 생성)
exports.getAccountBook = async (req, res) => {
  try {
    let accountBook = await AccountBook.findOne();
    
    // 가계부가 없으면 기본값으로 생성
    if (!accountBook) {
      accountBook = await AccountBook.create({
        totalAsset: 0,
        wishItems: [],
      });
    }
    
    res.status(200).json(accountBook);
  } catch (error) {
    res
      .status(500)
      .json({ message: '가계부 조회 실패', error: error.message });
  }
};

// 2. 총 재산 업데이트 (PATCH /accountbook)
exports.updateTotalAsset = async (req, res) => {
  try {
    const { totalAsset } = req.body;
    
    if (totalAsset === undefined || totalAsset === null) {
      return res.status(400).json({ message: '총 재산 값은 필수입니다.' });
    }

    let accountBook = await AccountBook.findOne();
    
    // 가계부가 없으면 생성
    if (!accountBook) {
      accountBook = await AccountBook.create({
        totalAsset: parseFloat(totalAsset),
        wishItems: [],
      });
    } else {
      accountBook.totalAsset = parseFloat(totalAsset);
      await accountBook.save();
    }
    
    res.status(200).json(accountBook);
  } catch (error) {
    res.status(400).json({ message: '총 재산 업데이트 실패', error: error.message });
  }
};

// 3. 사고 싶은 것 추가 (POST /accountbook/items)
exports.addWishItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '이름은 필수입니다.' });
    }
    
    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ message: '가격은 필수이며 0 이상이어야 합니다.' });
    }

    let accountBook = await AccountBook.findOne();
    
    // 가계부가 없으면 생성
    if (!accountBook) {
      accountBook = await AccountBook.create({
        totalAsset: 0,
        wishItems: [],
      });
    }

    accountBook.wishItems.push({
      name: name.trim(),
      price: parseFloat(price),
      isPurchased: false,
    });

    await accountBook.save();
    res.status(201).json(accountBook);
  } catch (error) {
    res.status(400).json({ message: '사고 싶은 것 추가 실패', error: error.message });
  }
};

// 4. 사고 싶은 것 수정 (구매 여부, 이름, 가격) (PATCH /accountbook/items/:itemId)
exports.updateWishItem = async (req, res) => {
  try {
    const { name, isPurchased, price, purchasedDate } = req.body;
    const accountBook = await AccountBook.findOne();
    
    if (!accountBook) {
      return res.status(404).json({ message: '가계부를 찾을 수 없습니다.' });
    }

    const item = accountBook.wishItems.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '항목을 찾을 수 없습니다.' });
    }

    if (name !== undefined) item.name = name.trim();
    if (isPurchased !== undefined) item.isPurchased = isPurchased;
    if (price !== undefined) {
      if (price === null || price < 0) {
        return res.status(400).json({ message: '가격은 0 이상이어야 합니다.' });
      }
      item.price = parseFloat(price);
    }
    if (purchasedDate !== undefined) {
      item.purchasedDate = purchasedDate ? new Date(purchasedDate) : null;
    }

    await accountBook.save();
    res.status(200).json(accountBook);
  } catch (error) {
    res.status(400).json({ message: '항목 수정 실패', error: error.message });
  }
};

// 5. 사고 싶은 것 삭제 (DELETE /accountbook/items/:itemId)
exports.deleteWishItem = async (req, res) => {
  try {
    const accountBook = await AccountBook.findOne();
    
    if (!accountBook) {
      return res.status(404).json({ message: '가계부를 찾을 수 없습니다.' });
    }

    const item = accountBook.wishItems.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '항목을 찾을 수 없습니다.' });
    }

    item.deleteOne();
    await accountBook.save();
    res.status(200).json(accountBook);
  } catch (error) {
    res.status(400).json({ message: '항목 삭제 실패', error: error.message });
  }
};

