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
    // 쿼리 파라미터로 상태 필터링 및 하위 프로젝트 필터링 (선택 사항)
    const { status, parentProjectId, topLevelOnly } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    // parentProjectId가 지정되면 해당 상위 프로젝트의 하위 프로젝트만 조회
    if (parentProjectId) {
      query.parentProjectId = parentProjectId;
    } else if (topLevelOnly === 'true') {
      // topLevelOnly가 true면 최상위 프로젝트만 조회 (parentProjectId가 없거나 null인 것들)
      query.$or = [
        { parentProjectId: { $exists: false } },
        { parentProjectId: null },
        { parentProjectId: '' },
      ];
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    // 기존 데이터 마이그레이션: isCompleted가 있고 status가 없으면 status로 변환
    for (const project of projects) {
      if (!project.status && project.isCompleted !== undefined) {
        project.status = project.isCompleted ? 'completed' : 'active';
        await project.save();
      }
    }
    
    // 다시 조회하여 업데이트된 데이터 반환
    const updatedProjects = await Project.find(query).sort({ createdAt: -1 });
    res.status(200).json(updatedProjects);
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
    
    // 기존 데이터 마이그레이션: isCompleted가 있고 status가 없으면 status로 변환
    if (!project.status && project.isCompleted !== undefined) {
      project.status = project.isCompleted ? 'completed' : 'active';
      await project.save();
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 기존 데이터 마이그레이션: isCompleted가 있고 status가 없으면 status로 변환
    if (!project.status && project.isCompleted !== undefined) {
      project.status = project.isCompleted ? 'completed' : 'active';
    }
    
    // 요청 본문에서 isCompleted가 있으면 status로 변환
    const updateData = { ...req.body };
    if (updateData.hasOwnProperty('isCompleted') && !updateData.status) {
      updateData.status = updateData.isCompleted ? 'completed' : 'active';
      delete updateData.isCompleted; // isCompleted 필드 제거
    }
    
    Object.assign(project, updateData);
    await project.save();
    
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

// 7. 프로젝트에 준비물 추가 (POST /projects/:id/items)
exports.addProjectItem = async (req, res) => {
  try {
    const { name, price } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '준비물 이름은 필수입니다.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }

    // 기존 데이터 마이그레이션
    if (!project.status && project.isCompleted !== undefined) {
      project.status = project.isCompleted ? 'completed' : 'active';
    }

    project.items.push({
      name: name.trim(),
      isPurchased: false,
      price: price ? parseFloat(price) : null,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: '준비물 추가 실패', error: error.message });
  }
};

// 8. 프로젝트 준비물 수정 (구매 여부, 이름, 가격) (PATCH /projects/:id/items/:itemId)
exports.updateProjectItem = async (req, res) => {
  try {
    const { name, isPurchased, price } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }

    const item = project.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '준비물을 찾을 수 없습니다.' });
    }

    // 기존 데이터 마이그레이션
    if (!project.status && project.isCompleted !== undefined) {
      project.status = project.isCompleted ? 'completed' : 'active';
    }

    if (name !== undefined) item.name = name.trim();
    if (isPurchased !== undefined) item.isPurchased = isPurchased;
    if (price !== undefined) item.price = price ? parseFloat(price) : null;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(400).json({ message: '준비물 수정 실패', error: error.message });
  }
};

// 9. 프로젝트 준비물 삭제 (DELETE /projects/:id/items/:itemId)
exports.deleteProjectItem = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }

    const item = project.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '준비물을 찾을 수 없습니다.' });
    }

    // 기존 데이터 마이그레이션
    if (!project.status && project.isCompleted !== undefined) {
      project.status = project.isCompleted ? 'completed' : 'active';
    }

    item.deleteOne();
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(400).json({ message: '준비물 삭제 실패', error: error.message });
  }
};
