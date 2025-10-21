const HabitCategory = require('../models/HabitCategory');

// 1. 카테고리 생성 (POST /habit-categories)
exports.createHabitCategory = async (req, res) => {
  try {
    const category = await HabitCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: '필수 필드(title)가 누락되었습니다.' });
    }
    res
      .status(500)
      .json({ message: '카테고리 생성 실패', error: error.message });
  }
};

// 2. 카테고리 목록 조회 (GET /habit-categories)
exports.getAllHabitCategories = async (req, res) => {
  try {
    const categories = await HabitCategory.find({}).sort({ createdAt: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: '카테고리 목록 조회 실패', error: error.message });
  }
};

// 3. 단일 카테고리 조회 (GET /habit-categories/:id)
exports.getHabitCategory = async (req, res) => {
  try {
    const category = await HabitCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ message: '카테고리 조회 실패', error: error.message });
  }
};

// 4. 카테고리 부분 수정 및 배열 수정 (PATCH /habit-categories/:id)
exports.updateHabitCategory = async (req, res) => {
  try {
    const { action, date, title } = req.body;
    let updateOperation = {};

    // 배열 수정 로직 처리
    if (action === 'add' && date) {
      // $addToSet: selectedDates 배열에 date를 추가합니다. 이미 있으면 중복 추가 방지.
      updateOperation = { $addToSet: { selectedDates: new Date(date) } };
    } else if (action === 'remove' && date) {
      // $pull: selectedDates 배열에서 해당 date와 일치하는 항목을 제거합니다.
      updateOperation = { $pull: { selectedDates: new Date(date) } };
    } else if (title) {
      // 일반 필드 수정
      updateOperation = { title };
    } else if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: '요청 본문에 수정 내용이 포함되어야 합니다.' });
    } else {
      // action, date, title 외의 일반적인 PATCH (예: description 등) 처리
      updateOperation = req.body;
    }

    const category = await HabitCategory.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(400)
      .json({ message: '카테고리 수정 실패', error: error.message });
  }
};

// 5. 카테고리 전체 수정 (PUT /habit-categories/:id)
exports.updateHabitCategoryFull = async (req, res) => {
  try {
    // _id 필드를 제외한 모든 내용을 요청 본문(req.body)으로 완전히 교체
    const category = await HabitCategory.findOneAndReplace(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(400)
      .json({ message: '카테고리 전체 수정 실패', error: error.message });
  }
};

// 6. 카테고리 삭제 (DELETE /habit-categories/:id)
exports.deleteHabitCategory = async (req, res) => {
  try {
    const category = await HabitCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    // 204 No Content 응답 (삭제 성공)
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: '카테고리 삭제 실패', error: error.message });
  }
};
