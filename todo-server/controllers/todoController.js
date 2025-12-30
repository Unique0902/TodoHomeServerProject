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

// 2. 할일 목록 조회 (GET /todos?date=...&projectId=...&noDueDate=true)
exports.getAllTodos = async (req, res) => {
  try {
    // --- 쿼리 파라미터에서 date, projectId, noDueDate를 추출 ---
    const { date, projectId, noDueDate } = req.query;
    let query = {};

    // 1. 수행일이 없는 할일 조회 (noDueDate 파라미터가 우선순위)
    if (noDueDate === 'true') {
      // 필드가 없거나 null인 경우 모두 포함
      query.$or = [
        { dueDate: { $exists: false } },
        { dueDate: null }
      ];
    }
    // 2. 날짜 필터링 로직 (date와 noDueDate가 동시에 오지 않는다고 가정)
    else if (date) {
      // 해당 날짜의 시작(00:00:00 UTC)부터 다음 날 시작 전까지
      // 프론트엔드에서 날짜만 선택한 경우 UTC 00:00:00으로 저장되므로 이 범위에 포함됨
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T00:00:00.000Z');
      endOfDay.setDate(endOfDay.getDate() + 1);

      query.dueDate = { $gte: startOfDay, $lt: endOfDay };
    }

    // 3. 프로젝트 ID 필터링 로직
    if (projectId) {
      query.projectId = projectId;
    }

    // --- 쿼리 실행 ---
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
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: '할일을 찾을 수 없습니다.' });
    }

    // isCompleted가 변경될 때 completedDate 처리 (모든 할일에 대해)
    if (req.body.hasOwnProperty('isCompleted')) {
      const updateData = { ...req.body };
      
      if (req.body.isCompleted === true) {
        // 완료로 변경: 현재 날짜 및 시간을 completedDate에 저장
        updateData.completedDate = new Date();
      } else if (req.body.isCompleted === false) {
        // 미완료로 변경: completedDate를 null로 설정
        updateData.completedDate = null;
      }
      
      const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
      
      res.status(200).json(updatedTodo);
    } else {
      // isCompleted가 변경되지 않은 경우 일반 업데이트
      const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      
      res.status(200).json(updatedTodo);
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: '할일 부분 수정 실패', error: error.message });
  }
};

// 5. 할일 전체 수정 (PUT /todos/:id) - 전체 교체 로직
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
