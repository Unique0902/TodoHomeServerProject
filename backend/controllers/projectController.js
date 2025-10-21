const Project = require('../models/Project');

// 1. 프로젝트 생성 (POST /projects)
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: '필수 필드(title)가 누락되었습니다.' });
    }
    res
      .status(500)
      .json({ message: '프로젝트 생성 실패', error: error.message });
  }
};

// 2. 프로젝트 목록 조회 (GET /projects)
exports.getAllProjects = async (req, res) => {
  try {
    // 쿼리 파라미터로 완료 상태 필터링을 추가할 수 있습니다 (선택 사항)
    const { isCompleted } = req.query;
    let query = {};

    if (isCompleted !== undefined) {
      // "true" 또는 "false" 문자열을 Boolean 값으로 변환
      query.isCompleted = isCompleted === 'true';
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: '프로젝트 목록 조회 실패', error: error.message });
  }
};

// 3. 단일 프로젝트 조회 (GET /projects/:id)
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    res.status(200).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: '프로젝트 조회 실패', error: error.message });
  }
};

// 4. 프로젝트 부분 수정 (PATCH /projects/:id)
exports.updateProjectPartial = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // 업데이트된 문서 반환
      runValidators: true, // 스키마 유효성 검사 실행
    });

    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    res.status(200).json(project);
  } catch (error) {
    res
      .status(400)
      .json({ message: '프로젝트 부분 수정 실패', error: error.message });
  }
};

// 5. 프로젝트 전체 수정 (PUT /projects/:id)
exports.updateProjectFull = async (req, res) => {
  try {
    // 요청 본문으로 모든 필드를 대체 (단, _id는 제외)
    const project = await Project.findOneAndReplace(
      { _id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    res.status(200).json(project);
  } catch (error) {
    res
      .status(400)
      .json({ message: '프로젝트 전체 수정 실패', error: error.message });
  }
};

// 6. 프로젝트 삭제 (DELETE /projects/:id)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    // 204 No Content 응답 (삭제 성공)
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: '프로젝트 삭제 실패', error: error.message });
  }
};
