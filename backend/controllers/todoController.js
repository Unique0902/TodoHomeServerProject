const Todo = require('../models/Todo');

// 1. 할일 생성 (POST /todos)
exports.createTodo = async (req, res) => {
  try {
    const todo = await Todo.create(req.body);
    // 201 Created 응답
    res.status(201).json(todo);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: '필수 필드(title)가 누락되었습니다.' });
    }
    res.status(500).json({ message: '할일 생성 실패', error: error.message });
  }
};

// 2. 할일 목록 조회 (GET /todos?date=...)
exports.getAllTodos = async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    // 날짜 필터링 로직 (쿼리 파라미터로 "YYYY-MM-DD" 형태의 날짜를 받아 필터링)
    if (date) {
      // Mongoose Date 쿼리를 위한 날짜 범위 설정
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1); // 다음 날 0시

      query.dueDate = { $gte: startOfDay, $lt: endOfDay };
    }

    // 생성일 기준 내림차순 정렬
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res
      .status(500)
      .json({ message: '할일 목록 조회 실패', error: error.message });
  }
};

// 3. 단일 할일 조회 (GET /todos/:id)
exports.getTodo = async (req, res) => {
  try {
    // ID 유효성 검사는 Mongoose가 자동으로 처리하지 못하는 경우 직접 확인 필요 (Optional)
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    }
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: '할일 조회 실패', error: error.message });
  }
};

// 4. 할일 부분 수정 (PATCH /todos/:id) - isCompleted 토글, title 변경 등
exports.updateTodoPartial = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // 업데이트된 문서 반환
      runValidators: true, // 스키마 유효성 검사 실행
    });

    if (!todo) {
      return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    }
    res.status(200).json(todo);
  } catch (error) {
    res
      .status(400)
      .json({ message: '할일 부분 수정 실패', error: error.message });
  }
};

// 5. 할일 전체 수정 (PUT /todos/:id) - 전체 교체 로직 (PATCH와 유사)
exports.updateTodoFull = async (req, res) => {
  try {
    const todo = await Todo.findOneAndReplace(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!todo) {
      return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    }
    res.status(200).json(todo);
  } catch (error) {
    res
      .status(400)
      .json({ message: '할일 전체 수정 실패', error: error.message });
  }
};

// 6. 할일 삭제 (DELETE /todos/:id)
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    }
    // 204 No Content 응답 (삭제 성공, 반환 데이터 없음)
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: '할일 삭제 실패', error: error.message });
  }
};
