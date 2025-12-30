const Habit = require('../models/Habit');

// 1. 습관 생성 (POST /habits)
exports.createHabit = async (req, res) => {
  try {
    const habit = await Habit.create(req.body);
    res.status(201).json(habit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: '필수 필드(title, habitCategoryId)가 누락되었습니다.',
      });
    }
    res.status(500).json({ message: '습관 생성 실패', error: error.message });
  }
};

// 2. 습관 목록 조회 (GET /habits?categoryId=...&projectId=...)
exports.getAllHabits = async (req, res) => {
  try {
    const { categoryId, projectId } = req.query;
    let query = {};

    // categoryId를 통한 필터링
    if (categoryId) {
      query.habitCategoryId = categoryId;
    }

    // projectId를 통한 필터링
    if (projectId) {
      query.projectId = projectId;
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

// **새로운 커스텀 API: 습관 완료 날짜 일괄 초기화**
// POST /api/v1/habits/reset-completions
// Body: { categoryId: "habitCategoryId", date: "YYYY-MM-DD" }
exports.resetCompletions = async (req, res) => {
  try {
    const { categoryId, date } = req.body;

    if (!categoryId || !date) {
      return res
        .status(400)
        .json({ message: 'categoryId와 date는 필수 필드입니다.' });
    }

    const dateToRemove = new Date(date);

    // [핵심 로직]
    // 1. habitCategoryId가 일치하는 모든 습관을 찾습니다.
    // 2. 해당 습관들의 completedDates 배열에서 주어진 날짜(dateToRemove)를 제거합니다.
    const result = await Habit.updateMany(
      { habitCategoryId: categoryId },
      { $pull: { completedDates: dateToRemove } }
    );

    // result.modifiedCount: 실제로 수정된 문서(습관)의 개수
    res.status(200).json({
      message: `${date} 날짜의 완료 기록이 ${result.modifiedCount}개 습관에서 초기화되었습니다.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: '습관 완료 기록 초기화 실패', error: error.message });
  }
};
