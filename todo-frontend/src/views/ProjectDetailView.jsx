import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProjectById,
  deleteProject,
  addProjectItem,
  updateProjectItem,
  deleteProjectItem,
  addProjectUrl,
  updateProjectUrl,
  deleteProjectUrl,
  getProjects,
  updateProjectStatus,
} from '../api/projectApi';
import { getTodosByProjectId, updateTodoStatus, updateTodo } from '../api/todoApi';
import { getHabitsByProjectId } from '../api/habitApi';
import TodoItem from '../components/TodoItem';
import { formatDateString } from '../utils/calendarUtils';
import '../styles/TodoDetailView.css'; // 상세 뷰 스타일 재활용
import '../styles/ProjectDetailView.css'; // 프로젝트 고유 스타일 (4번 섹션 참고)

const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [habits, setHabits] = useState([]); // 프로젝트 관련 습관
  const [subProjects, setSubProjects] = useState([]); // 하위 프로젝트 목록
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false); // 준비물 추가 폼 표시 여부
  const [newItemName, setNewItemName] = useState(''); // 새 준비물 이름
  const [newItemPrice, setNewItemPrice] = useState(''); // 새 준비물 가격
  // 수정 관련 상태
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false); // URL 추가 폼 표시 여부
  const [newUrlTitle, setNewUrlTitle] = useState(''); // 새 URL 제목
  const [newUrl, setNewUrl] = useState(''); // 새 URL
  const [showAddMenu, setShowAddMenu] = useState(false); // 추가 메뉴 표시 여부
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);

  // 날짜 포맷팅 헬퍼
  const formatDate = (dateString) => {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 데이터 로드
  const fetchProjectData = useCallback(async () => {
    try {
      // 프로젝트 정보 로드
      const projectData = await getProjectById(id);
      setProject(projectData);

      // 하위 할일 목록 로드 (projectId로 필터링)
      const todoData = await getTodosByProjectId(id);
      setTodos(todoData);

      // 프로젝트 관련 습관 로드
      const habitData = await getHabitsByProjectId(id);
      setHabits(habitData);

      // 하위 프로젝트 로드
      const subProjectsData = await getProjects({ parentProjectId: id });
      setSubProjects(subProjectsData);
    } catch (err) {
      setError('프로젝트 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 특정 프로젝트의 모든 하위 프로젝트를 재귀적으로 찾는 함수
  const getAllSubProjects = useCallback(async (projectId) => {
    const allProjectsData = await getProjects(); // 모든 프로젝트 가져오기
    
    const getAllSubProjectsRecursive = (parentId, allProjects) => {
      const result = [];
      const directSubProjects = allProjects.filter(
        (p) => p.parentProjectId === parentId
      );
      
      directSubProjects.forEach((subProject) => {
        result.push(subProject);
        // 재귀적으로 하위의 하위 프로젝트도 찾기
        const subSubProjects = getAllSubProjectsRecursive(subProject._id, allProjects);
        result.push(...subSubProjects);
      });
      
      return result;
    };
    
    return getAllSubProjectsRecursive(projectId, allProjectsData);
  }, []);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // 할일 완료 상태 토글 (하위 목록)
  const handleTodoToggle = async (todo) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      await updateTodoStatus(todo._id, !todo.isCompleted);
      
      // 데이터 갱신
      await fetchProjectData();
      
      // DOM 업데이트가 완료될 때까지 기다린 후 스크롤 위치 복원
      // 여러 번의 requestAnimationFrame을 사용하여 리렌더링 완료 보장
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPositionRef.current);
          });
        });
      });
    } catch (error) {
      alert('할일 상태 업데이트 실패!');
    }
  };

  // 오늘 날짜로 설정 핸들러 (기한 없는 할일을 오늘 날짜로 설정)
  const handleSetToday = async (todo) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
    try {
      // 오늘 날짜를 UTC 00:00:00으로 설정 (시간 없이 날짜만)
      const today = new Date();
      const todayString = formatDateString(today);
      const todayUTC = new Date(todayString + 'T00:00:00.000Z');
      
      await updateTodo(todo._id, {
        dueDate: todayUTC,
      });
      
      // 목록 갱신
      await fetchProjectData();
      
      // DOM 업데이트가 완료될 때까지 기다린 후 스크롤 위치 복원
      // 여러 번의 requestAnimationFrame을 사용하여 리렌더링 완료 보장
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPositionRef.current);
          });
        });
      });
    } catch (error) {
      alert('날짜 설정에 실패했습니다.');
    }
  };

  // 프로젝트 삭제 핸들러
  const handleDelete = async () => {
    // 삭제될 데이터 정보 수집
    const todoCount = todos.length;
    const habitCount = habits.length;
    const subProjectCount = subProjects.length;

    // 확인 메시지 생성
    let confirmMessage = `정말로 프로젝트 "${project.title}"을 삭제하시겠습니까?\n\n`;
    confirmMessage += `다음 데이터가 모두 삭제됩니다:\n`;
    confirmMessage += `- 할일: ${todoCount}개\n`;
    confirmMessage += `- 습관: ${habitCount}개\n`;
    confirmMessage += `- 하위 프로젝트: ${subProjectCount}개`;

    if (subProjectCount > 0) {
      confirmMessage += `\n\n※ 하위 프로젝트의 할일, 습관, 하위 프로젝트도 모두 삭제됩니다.`;
    }

    if (window.confirm(confirmMessage)) {
      try {
        await deleteProject(id);
        alert('프로젝트와 관련된 모든 데이터가 삭제되었습니다.');
        navigate('/projects'); // 목록 페이지로 이동
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  // 할일 목록 분리
  const activeTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);

  // 프로젝트 상태 가져오기 헬퍼 함수
  const getProjectStatus = (project) => {
    return project.status || (project.isCompleted ? 'completed' : 'active');
  };

  // 하위 프로젝트 상태별 분리
  const activeSubProjects = subProjects.filter((p) => {
    const status = getProjectStatus(p);
    return status !== 'completed';
  });
  const completedSubProjects = subProjects.filter((p) => {
    const status = getProjectStatus(p);
    return status === 'completed';
  });

  // 프로젝트 상태 텍스트 가져오기
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '✅ 완료';
      case 'paused':
        return '⏸️ 정지됨';
      case 'wish':
        return '💡 위시';
      default:
        return '🔲 진행중';
    }
  };

  // 현재 프로젝트 상태 가져오기
  const getCurrentStatus = () => {
    return project.status || (project.isCompleted ? 'completed' : 'active');
  };

  // 프로젝트 상태 변경 핸들러
  const handleStatusChange = async (newStatus) => {
    const currentStatus = getCurrentStatus();
    
    // 같은 상태로 변경하려는 경우 무시
    if (currentStatus === newStatus) return;

    const statusTexts = {
      active: '진행중',
      paused: '정지됨',
      wish: '위시',
      completed: '완료',
    };

    const currentStatusText = statusTexts[currentStatus] || '진행중';
    const newStatusText = statusTexts[newStatus] || '진행중';

    // 모든 하위 프로젝트 가져오기 (재귀적으로)
    const allSubProjects = await getAllSubProjects(id);
    
    // 상태가 변경될 하위 프로젝트 필터링 (완료됨, 위시 상태는 제외)
    const subProjectsToUpdate = allSubProjects.filter((subProject) => {
      const subStatus = subProject.status || (subProject.isCompleted ? 'completed' : 'active');
      return subStatus !== 'completed' && subStatus !== 'wish';
    });

    // 확인 메시지 구성
    let confirmMessage = `프로젝트 상태를 "${currentStatusText}"에서 "${newStatusText}"로 변경하시겠습니까?`;
    
    if (subProjectsToUpdate.length > 0) {
      confirmMessage += `\n\n하위 프로젝트 ${subProjectsToUpdate.length}개도 함께 "${newStatusText}" 상태로 변경됩니다.`;
    }

    if (window.confirm(confirmMessage)) {
      try {
        // 상위 프로젝트 상태 변경
        await updateProjectStatus(id, newStatus);
        
        // 상태 변경 대상 하위 프로젝트들의 상태도 변경
        if (subProjectsToUpdate.length > 0) {
          await Promise.all(
            subProjectsToUpdate.map((subProject) =>
              updateProjectStatus(subProject._id, newStatus)
            )
          );
        }
        
        fetchProjectData(); // 프로젝트 데이터 갱신
      } catch (error) {
        alert('상태 변경에 실패했습니다.');
      }
    }
  };

  // 프로젝트 Map 생성 (현재 프로젝트만 포함, 다른 프로젝트와 연결된 할일이 있을 수 있으므로)
  const projectMap = project ? new Map([[project._id, project]]) : new Map();

  // 예산 계산
  const budgetStats = useMemo(() => {
    if (!project || !project.items) return { totalBudget: 0, remainingBudget: 0 };
    
    const itemsWithPrice = project.items.filter((item) => item.price !== null && item.price !== undefined);
    const totalBudget = itemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);
    
    const unpurchasedItemsWithPrice = itemsWithPrice.filter((item) => !item.isPurchased);
    const remainingBudget = unpurchasedItemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);
    
    return { totalBudget, remainingBudget };
  }, [project]);

  // 준비물 추가 핸들러
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('준비물 이름을 입력해주세요.');
      return;
    }

    try {
      await addProjectItem(id, {
        name: newItemName.trim(),
        price: newItemPrice ? parseFloat(newItemPrice) : null,
      });
      setNewItemName('');
      setNewItemPrice('');
      setShowItemForm(false);
      fetchProjectData(); // 프로젝트 데이터 갱신
    } catch (error) {
      alert('준비물 추가에 실패했습니다.');
    }
  };

  // 구매 날짜/시간 포맷팅 헬퍼
  const formatPurchaseDateTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} ${timeStr}`;
    } catch (e) {
      console.error('구매 날짜 포맷 오류:', e);
      return '';
    }
  };

  // 준비물 구매 여부 토글
  const handleItemToggle = async (item) => {
    try {
      const newIsPurchased = !item.isPurchased;
      const updateData = {
        isPurchased: newIsPurchased,
      };
      
      // 구매 처리 시 현재 날짜/시간 저장, 구매 취소 시 null로 설정
      if (newIsPurchased) {
        updateData.purchasedDate = new Date();
      } else {
        updateData.purchasedDate = null;
      }
      
      await updateProjectItem(id, item._id, updateData);
      fetchProjectData(); // 프로젝트 데이터 갱신
    } catch (error) {
      alert('구매 여부 업데이트에 실패했습니다.');
    }
  };

  // 준비물 삭제 핸들러
  const handleDeleteItem = async (itemId, itemName) => {
    if (window.confirm(`"${itemName}" 준비물을 삭제하시겠습니까?`)) {
      try {
        await deleteProjectItem(id, itemId);
        fetchProjectData(); // 프로젝트 데이터 갱신
      } catch (error) {
        alert('준비물 삭제에 실패했습니다.');
      }
    }
  };

  // 준비물 수정 시작 핸들러
  const handleStartEditItem = (item) => {
    setEditingItemId(item._id);
    setEditItemName(item.name);
    setEditItemPrice(item.price !== null && item.price !== undefined ? item.price.toString() : '');
  };

  // 준비물 수정 취소 핸들러
  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditItemName('');
    setEditItemPrice('');
  };

  // 준비물 수정 저장 핸들러
  const handleSaveEditItem = async (itemId) => {
    if (!editItemName.trim()) {
      alert('준비물 이름을 입력해주세요.');
      return;
    }

    const priceValue = editItemPrice ? parseFloat(editItemPrice) : null;
    if (priceValue !== null && (isNaN(priceValue) || priceValue < 0)) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      await updateProjectItem(id, itemId, {
        name: editItemName.trim(),
        price: priceValue,
      });
      handleCancelEditItem();
      fetchProjectData(); // 프로젝트 데이터 갱신
    } catch (error) {
      alert('준비물 수정에 실패했습니다.');
    }
  };

  // URL 추가 핸들러
  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!newUrlTitle.trim()) {
      alert('URL 제목을 입력해주세요.');
      return;
    }
    if (!newUrl.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    try {
      await addProjectUrl(id, {
        title: newUrlTitle.trim(),
        url: newUrl.trim(),
      });
      setNewUrlTitle('');
      setNewUrl('');
      setShowUrlForm(false);
      fetchProjectData(); // 프로젝트 데이터 갱신
    } catch (error) {
      alert('URL 추가에 실패했습니다.');
    }
  };

  // URL 삭제 핸들러
  const handleDeleteUrl = async (urlId, urlTitle) => {
    if (window.confirm(`"${urlTitle}" URL을 삭제하시겠습니까?`)) {
      try {
        await deleteProjectUrl(id, urlId);
        fetchProjectData(); // 프로젝트 데이터 갱신
      } catch (error) {
        alert('URL 삭제에 실패했습니다.');
      }
    }
  };

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!project)
    return <div className='empty-state'>프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div className='project-detail-view'>
      <header className='header-bar detail-header'>
        {/* 1. 뒤로가기 버튼 */}
        <button
          className='back-button'
          onClick={() => {
            // 하위 프로젝트인 경우 부모 프로젝트 상세 페이지로, 아니면 프로젝트 목록으로
            if (project.parentProjectId) {
              navigate(`/projects/${project.parentProjectId}`);
            } else {
              navigate('/projects');
            }
          }}
        >
          &lt;
        </button>
        {/* 2. 프로젝트 제목 */}
        <h1 className='title'>{project.title}</h1>

        {/* 3. 우측 상단 관리 버튼 그룹 (수정 및 삭제) */}
        <div className='top-action-group'>
          {/* 삭제 버튼 (추가) */}
          <button
            className='delete-button-icon'
            onClick={handleDelete}
            title='프로젝트 삭제'
          >
            <span role='img' aria-label='delete'>
              🗑️
            </span>
          </button>

          {/* 수정 버튼 (기존 위치 변경) */}
          <button
            className='edit-button-icon'
            onClick={() => navigate(`/projects/${id}/edit`)}
            title='프로젝트 수정'
          >
            <span role='img' aria-label='edit'>
              ✏️
            </span>
          </button>
        </div>
      </header>

      <main className='detail-content'>
        {/* ... (설명, 상태, 하위 할일 목록 섹션 유지) ... */}

        {/* 설명 정보 */}
        <div className='info-group'>
          <span className='label'>설명</span>
          <p className='value description'>
            {project.description || '설명 없음'}
          </p>
        </div>

        <div className='info-group'>
          <span className='label'>상태</span>
          <div className='status-buttons-container'>
            {[
              { value: 'active', label: '🔲 진행중' },
              { value: 'paused', label: '⏸️ 정지됨' },
              { value: 'wish', label: '💡 위시' },
              { value: 'completed', label: '✅ 완료' },
            ].map((statusOption) => {
              const currentStatus = getCurrentStatus();
              const isSelected = currentStatus === statusOption.value;
              return (
                <button
                  key={statusOption.value}
                  className={`status-button ${statusOption.value} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleStatusChange(statusOption.value)}
                >
                  {statusOption.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- 하위 프로젝트 섹션 --- */}
        {activeSubProjects.length > 0 && (
          <>
            <h2 className='todo-list-title'>하위 프로젝트</h2>
            <section className='project-habits-section'>
              <div className='project-habits-list'>
                {activeSubProjects.map((subProject) => {
                  const status = getProjectStatus(subProject);
                  return (
                    <div
                      key={subProject._id}
                      className='project-habit-item'
                      onClick={() => navigate(`/projects/${subProject._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className='habit-title'>{subProject.title}</div>
                      {subProject.description && (
                        <div className='habit-description'>
                          {subProject.description}
                        </div>
                      )}
                      <div className='project-status-badge'>{getStatusText(status)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* --- 완료된 하위 프로젝트 섹션 --- */}
        {completedSubProjects.length > 0 && (
          <>
            <h2 className='todo-list-title'>완료된 하위 프로젝트</h2>
            <section className='project-habits-section'>
              <div className='project-habits-list'>
                {completedSubProjects.map((subProject) => {
                  const status = getProjectStatus(subProject);
                  return (
                    <div
                      key={subProject._id}
                      className='project-habit-item'
                      onClick={() => navigate(`/projects/${subProject._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className='habit-title'>{subProject.title}</div>
                      {subProject.description && (
                        <div className='habit-description'>
                          {subProject.description}
                        </div>
                      )}
                      <div className='project-status-badge'>{getStatusText(status)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* --- 습관 섹션 --- */}
        {habits.length > 0 && (
          <>
            <h2 className='todo-list-title'>습관</h2>
            <section className='project-habits-section'>
              <div className='project-habits-list'>
                {habits.map((habit) => (
                  <div key={habit._id} className='project-habit-item'>
                    <div className='habit-title'>{habit.title}</div>
                    {habit.description && (
                      <div className='habit-description'>{habit.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* --- 준비물 섹션 --- */}
        <h2 className='todo-list-title'>준비물</h2>
        <section className='project-items-section'>
          {/* 예산 정보 */}
          <div className='budget-info'>
            <div className='budget-item'>
              <span className='budget-label'>총 필요한 예산:</span>
              <span className='budget-value'>
                {budgetStats.totalBudget.toLocaleString()}원
              </span>
            </div>
            <div className='budget-item'>
              <span className='budget-label'>추가로 필요한 예산:</span>
              <span className='budget-value remaining'>
                {budgetStats.remainingBudget.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 준비물 리스트 */}
          <div className='project-items-list'>
            {(!project.items || project.items.length === 0) ? (
              <p className='empty-message small'>준비물이 없습니다.</p>
            ) : (
              project.items.map((item) => (
                <div
                  key={item._id}
                  className={`project-item-row ${item.isPurchased ? 'purchased' : ''}`}
                >
                  {editingItemId === item._id ? (
                    // 수정 폼
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEditItem(item._id);
                      }}
                      className='item-edit-form'
                      style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <input
                        type='text'
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        className='item-name-input'
                        style={{ flex: 1, minWidth: '120px' }}
                        autoFocus
                      />
                      <input
                        type='number'
                        value={editItemPrice}
                        onChange={(e) => setEditItemPrice(e.target.value)}
                        className='item-price-input'
                        min='0'
                        step='1'
                        placeholder='가격 (선택)'
                        style={{ width: '120px' }}
                      />
                      <button type='submit' className='item-edit-save-button' title='저장'>
                        ✓
                      </button>
                      <button
                        type='button'
                        onClick={handleCancelEditItem}
                        className='item-edit-cancel-button'
                        title='취소'
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    // 일반 표시
                    <>
                      <div className='item-checkbox' onClick={() => handleItemToggle(item)}>
                        <input
                          type='checkbox'
                          checked={item.isPurchased}
                          readOnly
                          className='checkbox-input'
                        />
                      </div>
                      <div className='item-content'>
                        <div className='item-name'>{item.name}</div>
                        {item.price !== null && item.price !== undefined && (
                          <div className='item-price'>{item.price.toLocaleString()}원</div>
                        )}
                      </div>
                      {item.isPurchased && item.purchasedDate && (
                        <div className='item-purchase-date'>
                          {formatPurchaseDateTime(item.purchasedDate)}
                        </div>
                      )}
                      <button
                        className='item-edit-button'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditItem(item);
                        }}
                        title='수정'
                      >
                        ✏️
                      </button>
                      <button
                        className='item-delete-button'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item._id, item.name);
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 준비물 추가 폼 */}
          {showItemForm ? (
            <form onSubmit={handleAddItem} className='item-add-form'>
              <div className='form-row'>
                <input
                  type='text'
                  placeholder='준비물 이름'
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className='item-name-input'
                  autoFocus
                />
                <input
                  type='number'
                  placeholder='가격 (선택)'
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className='item-price-input'
                  min='0'
                  step='1'
                />
              </div>
              <div className='form-actions'>
                <button type='submit' className='item-add-confirm-button'>
                  추가
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowItemForm(false);
                    setNewItemName('');
                    setNewItemPrice('');
                  }}
                  className='item-add-cancel-button'
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <button
              className='add-item-button'
              onClick={() => setShowItemForm(true)}
            >
              + 준비물 추가
            </button>
          )}
        </section>

        {/* --- URL 섹션 --- */}
        <h2 className='todo-list-title'>URL</h2>
        <section className='project-items-section'>
          <div className='urls-list'>
            {project.urls && project.urls.length > 0 ? (
              project.urls.map((urlItem) => (
                <div key={urlItem._id} className='url-item-row'>
                  <a
                    href={urlItem.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='url-link'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='url-title'>{urlItem.title}</div>
                    <div className='url-address'>{urlItem.url}</div>
                  </a>
                  <button
                    className='url-delete-button'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUrl(urlItem._id, urlItem.title);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <p className='empty-message small'>등록된 URL이 없습니다.</p>
            )}
          </div>

          {/* URL 추가 폼 */}
          {showUrlForm ? (
            <form onSubmit={handleAddUrl} className='item-add-form'>
              <div className='form-row'>
                <input
                  type='text'
                  placeholder='URL 제목'
                  value={newUrlTitle}
                  onChange={(e) => setNewUrlTitle(e.target.value)}
                  className='item-name-input'
                  autoFocus
                />
              </div>
              <div className='form-row'>
                <input
                  type='url'
                  placeholder='https://example.com'
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className='item-name-input'
                />
              </div>
              <div className='form-actions'>
                <button type='submit' className='item-add-confirm-button'>
                  추가
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowUrlForm(false);
                    setNewUrlTitle('');
                    setNewUrl('');
                  }}
                  className='item-add-cancel-button'
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <button
              className='add-item-button'
              onClick={() => setShowUrlForm(true)}
            >
              + URL 추가
            </button>
          )}
        </section>

        {/* --- 하위 할일 목록 섹션 --- */}
        <h2 className='todo-list-title'>할일 List</h2>

        <section className='todo-list-project'>
          <div className='todo-list active-list'>
            {activeTodos.length === 0 && (
              <p className='empty-message small'>진행할 할일이 없습니다.</p>
            )}
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleTodoToggle}
                projectMap={projectMap}
                onSetToday={handleSetToday}
                showTodayButton={true}
                // 프로젝트 상세 페이지에서 할일 상세 페이지로 이동 시 프로젝트 ID 전달
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/todos/${todo._id}`, {
                    state: { fromProjectId: id },
                  });
                }}
              />
            ))}
          </div>

          <h3 className='completed-sub-title'>완료</h3>
          <div className='todo-list completed-list'>
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleTodoToggle}
                projectMap={projectMap}
                // 프로젝트 상세 페이지에서 할일 상세 페이지로 이동 시 프로젝트 ID 전달
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/todos/${todo._id}`, {
                    state: { fromProjectId: id },
                  });
                }}
              />
            ))}
          </div>
        </section>
      </main>

      {/* 하단 액션 버튼 섹션 */}
      <footer className='action-bar project-action-bar-bottom'>
        {/* 추가 메뉴 */}
        {showAddMenu && (
          <div className='add-menu-overlay' onClick={() => setShowAddMenu(false)}>
            <div className='add-menu' onClick={(e) => e.stopPropagation()}>
              <button
                className='add-menu-item'
                onClick={() => {
                  setShowAddMenu(false);
                  navigate(`/todos/add?projectId=${id}&projectName=${project.title}`);
                }}
              >
                할일 추가
              </button>
              <button
                className='add-menu-item'
                onClick={() => {
                  setShowAddMenu(false);
                  navigate(`/habits/add?projectId=${id}`);
                }}
              >
                습관 추가
              </button>
              <button
                className='add-menu-item'
                onClick={() => {
                  setShowAddMenu(false);
                  navigate(`/projects/add?parentProjectId=${id}`);
                }}
              >
                프로젝트 추가
              </button>
              <button
                className='add-menu-cancel'
                onClick={() => setShowAddMenu(false)}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 플러스 버튼 (우측 하단 배치) */}
        <button
          className='add-todo-button'
          onClick={() => setShowAddMenu(true)}
        >
          +
        </button>
      </footer>
    </div>
  );
};

export default ProjectDetailView;
