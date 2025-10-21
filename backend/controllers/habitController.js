const Habit = require('../models/Habit');

// 1. 습관 생성 (POST /habits)
exports.createHabit = async (req, res) => {
  try {
    const habit = await Habit.create(req.body);
    res.status(201).json(habit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({
          message: '필수 필드(title, habitCategoryId)가 누락되었습니다.',
        });
    }
    res.status(500).json({ message: '습관 생성 실패', error: error.message });
  }
};

// 2. 습관 목록 조회 (GET /habits?categoryId=...)
exports.getAllHabits = async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = {};

    // categoryId를 통한 필터링
    if (categoryId) {
      query.habitCategoryId = categoryId;
    }

    const habits = await Habit.find(query).sort({ createdAt: 1 });
    res.status(200).json(habits);
  } catch (error) {
    res
      .status(500)
      .json({ message: '습관 목록 조회 실패', error: error.message });
  }
};

// 3. 단일 습관 조회 (GET /habits/:id)
exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ message: '습관 조회 실패', error: error.message });
  }
};

// 4. 습관 부분 수정 및 완료 날짜 배열 수정 (PATCH /habits/:id)
exports.updateHabit = async (req, res) => {
  try {
    const { action, date, title, description, habitCategoryId } = req.body;
    let updateOperation = {};

    // 배열 수정 로직 처리 (완료 날짜 추가/제거)
    if (action === 'add' && date) {
      // $addToSet: completedDates 배열에 날짜를 추가 (중복 방지)
      updateOperation = { $addToSet: { completedDates: new Date(date) } };
    } else if (action === 'remove' && date) {
      // $pull: completedDates 배열에서 해당 날짜를 제거
      updateOperation = { $pull: { completedDates: new Date(date) } };
    } else if (Object.keys(req.body).length > 0) {
      // 일반 필드 수정 (title, description, habitCategoryId)
      // action과 date를 제외하고 나머지 필드를 업데이트 대상에 포함
      const { action, date, ...rest } = req.body;
      updateOperation = rest;
    } else {
      return res
        .status(400)
        .json({ message: '요청 본문에 수정 내용이 포함되어야 합니다.' });
    }

    const habit = await Habit.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }
    res.status(200).json(habit);
  } catch (error) {
    res.status(400).json({ message: '습관 수정 실패', error: error.message });
  }
};

// 5. 습관 전체 수정 (PUT /habits/:id)
exports.updateHabitFull = async (req, res) => {
  try {
    const habit = await Habit.findOneAndReplace(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }
    res.status(200).json(habit);
  } catch (error) {
    res
      .status(400)
      .json({ message: '습관 전체 수정 실패', error: error.message });
  }
};

// 6. 습관 삭제 (DELETE /habits/:id)
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: '습관 삭제 실패', error: error.message });
  }
};
