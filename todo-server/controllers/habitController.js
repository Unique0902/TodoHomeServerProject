const Habit = require('../models/Habit');

// 1. 습관 생성 (POST /habits)
exports.createHabit = async (req, res) => {
  try {
    // order가 제공되지 않으면 해당 카테고리의 최대 order + 1로 설정
    if (req.body.order === undefined && req.body.habitCategoryId) {
      const maxOrderHabit = await Habit.findOne({ habitCategoryId: req.body.habitCategoryId })
        .sort({ order: -1 })
        .select('order');
      req.body.order = maxOrderHabit && maxOrderHabit.order !== undefined 
        ? maxOrderHabit.order + 1 
        : 0;
    }
    
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

    // order 필드로 정렬, 없으면 createdAt으로 정렬 (기존 데이터 호환성)
    let habits = await Habit.find(query).sort({ order: 1, createdAt: 1 });
    
    // order가 없는 습관들을 자동으로 마이그레이션 (기존 데이터 호환성)
    const habitsWithoutOrder = habits.filter(h => h.order === undefined || h.order === null);
    if (habitsWithoutOrder.length > 0) {
      // 같은 카테고리/프로젝트 내에서 order가 있는 습관들의 최대 order 값 찾기
      const habitsWithOrder = habits.filter(h => h.order !== undefined && h.order !== null);
      let maxOrder = habitsWithOrder.length > 0 
        ? Math.max(...habitsWithOrder.map(h => h.order))
        : -1;
      
      // order가 없는 습관들에 순차적으로 order 값 부여
      for (const habit of habitsWithoutOrder) {
        maxOrder += 1;
        habit.order = maxOrder;
        await habit.save();
      }
      
      // 다시 조회하여 업데이트된 order로 정렬
      habits = await Habit.find(query).sort({ order: 1, createdAt: 1 });
    }
    
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
    const { action, date, title, description, habitCategoryId, projectId } = req.body;
    let updateOperation = {};

    // 배열 수정 로직 처리 (완료 날짜 추가/제거)
    if (action === 'add' && date) {
      // $addToSet: completedDates 배열에 날짜를 추가 (중복 방지)
      updateOperation = { $addToSet: { completedDates: new Date(date) } };
    } else if (action === 'remove' && date) {
      // $pull: completedDates 배열에서 해당 날짜를 제거
      updateOperation = { $pull: { completedDates: new Date(date) } };
    } else if (Object.keys(req.body).length > 0) {
      // 일반 필드 수정 (title, description, habitCategoryId, projectId)
      // action과 date를 제외하고 나머지 필드를 업데이트 대상에 포함
      const { action, date, ...rest } = req.body;
      
      // projectId가 빈 문자열로 오면 null로 설정 (프로젝트 연결 해제)
      if ('projectId' in rest && rest.projectId === '') {
        rest.projectId = null;
      }
      
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

// 7. 습관에 URL 추가 (POST /habits/:id/urls)
exports.addHabitUrl = async (req, res) => {
  try {
    const { title, url } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'URL 제목은 필수입니다.' });
    }
    
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'URL은 필수입니다.' });
    }

    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }

    habit.urls.push({
      title: title.trim(),
      url: url.trim(),
    });

    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    res.status(400).json({ message: 'URL 추가 실패', error: error.message });
  }
};

// 8. 습관 URL 수정 (PATCH /habits/:id/urls/:urlId)
exports.updateHabitUrl = async (req, res) => {
  try {
    const { title, url } = req.body;
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }

    const urlItem = habit.urls.id(req.params.urlId);
    if (!urlItem) {
      return res.status(404).json({ message: 'URL을 찾을 수 없습니다.' });
    }

    if (title !== undefined) urlItem.title = title.trim();
    if (url !== undefined) urlItem.url = url.trim();

    await habit.save();
    res.status(200).json(habit);
  } catch (error) {
    res.status(400).json({ message: 'URL 수정 실패', error: error.message });
  }
};

// 9. 습관 URL 삭제 (DELETE /habits/:id/urls/:urlId)
exports.deleteHabitUrl = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ message: '습관을 찾을 수 없습니다.' });
    }

    const urlItem = habit.urls.id(req.params.urlId);
    if (!urlItem) {
      return res.status(404).json({ message: 'URL을 찾을 수 없습니다.' });
    }

    urlItem.deleteOne();
    await habit.save();
    res.status(200).json(habit);
  } catch (error) {
    res.status(400).json({ message: 'URL 삭제 실패', error: error.message });
  }
};

// 10. 습관 순서 일괄 업데이트 (PATCH /habits/reorder)
exports.reorderHabits = async (req, res) => {
  try {
    const { habitIds } = req.body; // 순서대로 정렬된 습관 ID 배열
    
    if (!Array.isArray(habitIds) || habitIds.length === 0) {
      return res.status(400).json({ message: '습관 ID 배열이 필요합니다.' });
    }

    // 각 습관의 order를 배열 인덱스로 업데이트
    const updatePromises = habitIds.map((habitId, index) => 
      Habit.findByIdAndUpdate(habitId, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);
    
    // 업데이트된 습관 목록 반환
    const updatedHabits = await Habit.find({ _id: { $in: habitIds } }).sort({ order: 1 });
    res.status(200).json(updatedHabits);
  } catch (error) {
    res.status(400).json({ message: '습관 순서 업데이트 실패', error: error.message });
  }
};
