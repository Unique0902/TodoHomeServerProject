import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getAccountBook,
  updateTotalAsset,
  addWishItem,
  updateWishItem,
  deleteWishItem,
} from '../api/accountBookApi';
import { getProjects, updateProjectItem } from '../api/projectApi';
import '../styles/AccountBookView.css';

const AccountBookView = () => {
  const [accountBook, setAccountBook] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showAssetEdit, setShowAssetEdit] = useState(false);
  const [editAssetValue, setEditAssetValue] = useState('');
  // 수정 관련 상태
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  
  // 스크롤 위치 저장용 ref
  const scrollPositionRef = useRef(0);
  
  // 섹션 토글 상태
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(true);
  const [isWishItemsExpanded, setIsWishItemsExpanded] = useState(true);
  const [isPurchasedItemsExpanded, setIsPurchasedItemsExpanded] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  // 데이터 로드
  const fetchAccountBook = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getAccountBook();
      setAccountBook(data);
    } catch (err) {
      console.error('가계부 로드 실패:', err);
      setError('가계부 정보를 불러오지 못했습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 프로젝트 목록 로드
  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchAccountBook();
    fetchProjects();
  }, [fetchAccountBook, fetchProjects]);

  // 사고 싶은 것에 필요한 총 예산 계산 (미구매 항목만)
  const wishItemsBudget = useMemo(() => {
    if (!accountBook || !accountBook.wishItems) return 0;
    return accountBook.wishItems
      .filter((item) => !item.isPurchased)
      .reduce((sum, item) => sum + (item.price || 0), 0);
  }, [accountBook]);

  // 프로젝트에 추가로 필요한 총 예산 계산 (미구매 준비물만)
  const projectsBudget = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    return projects.reduce((total, project) => {
      if (!project.items || project.items.length === 0) return total;
      const projectBudget = project.items
        .filter((item) => !item.isPurchased) // 미구매 항목만 필터링
        .reduce((sum, item) => {
          if (item.price !== null && item.price !== undefined) {
            return sum + (item.price || 0);
          }
          return sum;
        }, 0);
      return total + projectBudget;
    }, 0);
  }, [projects]);

  // 총 필요한 예산 (사고 싶은 것 + 프로젝트)
  const totalBudget = useMemo(() => {
    return wishItemsBudget + projectsBudget;
  }, [wishItemsBudget, projectsBudget]);

  // 미구매 준비물 예산이 0원보다 큰 프로젝트만 필터링
  const projectsWithBudget = useMemo(() => {
    return projects.filter((project) => {
      if (!project.items || project.items.length === 0) return false;
      // 미구매 항목만 계산
      const remainingBudget = project.items
        .filter((item) => !item.isPurchased)
        .reduce((sum, item) => {
          if (item.price !== null && item.price !== undefined) {
            return sum + (item.price || 0);
          }
          return sum;
        }, 0);
      return remainingBudget > 0;
    });
  }, [projects]);

  // 프로젝트 준비물 토글 핸들러
  const handleProjectItemToggle = async (projectId, item) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
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
      
      await updateProjectItem(projectId, item._id, updateData);
      
      // 프로젝트 목록 갱신
      await fetchProjects();
      
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
      alert('구매 여부 업데이트에 실패했습니다.');
    }
  };

  // 총 재산 수정 핸들러
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    const assetValue = parseFloat(editAssetValue);
    if (isNaN(assetValue) || assetValue < 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    try {
      await updateTotalAsset(assetValue);
      setShowAssetEdit(false);
      setEditAssetValue('');
      fetchAccountBook();
    } catch (error) {
      alert('총 재산 업데이트에 실패했습니다.');
    }
  };

  // 사고 싶은 것 추가 핸들러
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    const priceValue = parseFloat(newItemPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      await addWishItem({
        name: newItemName.trim(),
        price: priceValue,
      });
      setNewItemName('');
      setNewItemPrice('');
      setShowItemForm(false);
      fetchAccountBook();
    } catch (error) {
      alert('항목 추가에 실패했습니다.');
    }
  };

  // 구매 여부 토글 핸들러
  const handleItemToggle = async (item) => {
    // 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY;
    
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
      
      await updateWishItem(item._id, updateData);
      
      // 데이터 갱신 (로딩 상태 변경 없이)
      await fetchAccountBook(false);
      
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
      alert('구매 여부 업데이트에 실패했습니다.');
    }
  };

  // 항목 삭제 핸들러
  const handleDeleteItem = async (itemId, itemName) => {
    if (window.confirm(`"${itemName}" 항목을 삭제하시겠습니까?`)) {
      try {
        await deleteWishItem(itemId);
        fetchAccountBook();
      } catch (error) {
        alert('항목 삭제에 실패했습니다.');
      }
    }
  };

  // 항목 수정 시작 핸들러
  const handleStartEdit = (item) => {
    setEditingItemId(item._id);
    setEditItemName(item.name);
    setEditItemPrice(item.price.toString());
  };

  // 항목 수정 취소 핸들러
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemName('');
    setEditItemPrice('');
  };

  // 항목 수정 저장 핸들러
  const handleSaveEdit = async (itemId) => {
    if (!editItemName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    const priceValue = parseFloat(editItemPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      await updateWishItem(itemId, {
        name: editItemName.trim(),
        price: priceValue,
      });
      handleCancelEdit();
      fetchAccountBook();
    } catch (error) {
      alert('항목 수정에 실패했습니다.');
    }
  };

  // 프로젝트 준비물 수정 시작 핸들러
  const handleStartEditProjectItem = (projectId, item) => {
    setEditingItemId(`${projectId}-${item._id}`);
    setEditItemName(item.name);
    setEditItemPrice(item.price !== null && item.price !== undefined ? item.price.toString() : '');
  };

  // 프로젝트 준비물 수정 저장 핸들러
  const handleSaveEditProjectItem = async (projectId, itemId) => {
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
      await updateProjectItem(projectId, itemId, {
        name: editItemName.trim(),
        price: priceValue,
      });
      handleCancelEdit();
      fetchProjects(); // 프로젝트 목록 갱신
    } catch (error) {
      alert('준비물 수정에 실패했습니다.');
    }
  };

  // 사고 싶은 것 목록 분리
  const unpurchasedItems = accountBook?.wishItems?.filter((item) => !item.isPurchased) || [];
  const purchasedItems = accountBook?.wishItems?.filter((item) => item.isPurchased) || [];

  // 모든 구매한 항목 수집 (wishItems + project items)
  const allPurchasedItems = useMemo(() => {
    const items = [];
    
    // wishItems 중 구매한 항목
    if (accountBook?.wishItems) {
      accountBook.wishItems
        .filter((item) => item.isPurchased)
        .forEach((item) => {
          items.push({
            ...item,
            type: 'wish',
            projectTitle: null,
          });
        });
    }
    
    // project items 중 구매한 항목
    projects.forEach((project) => {
      if (project.items) {
        project.items
          .filter((item) => item.isPurchased)
          .forEach((item) => {
            items.push({
              ...item,
              type: 'project',
              projectTitle: project.title,
              projectId: project._id,
            });
          });
      }
    });
    
    return items;
  }, [accountBook, projects]);

  // 구매날짜가 있는 항목과 없는 항목 분리
  const purchasedItemsWithDate = useMemo(() => {
    return allPurchasedItems.filter((item) => item.purchasedDate);
  }, [allPurchasedItems]);

  const purchasedItemsWithoutDate = useMemo(() => {
    return allPurchasedItems.filter((item) => !item.purchasedDate);
  }, [allPurchasedItems]);

  // 날짜별로 그룹화
  const itemsByDate = useMemo(() => {
    const grouped = {};
    
    purchasedItemsWithDate.forEach((item) => {
      const date = new Date(item.purchasedDate);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    // 날짜별로 정렬 (최신순)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, date) => {
        acc[date] = grouped[date].sort((a, b) => new Date(b.purchasedDate) - new Date(a.purchasedDate));
        return acc;
      }, {});
  }, [purchasedItemsWithDate]);

  // 월별로 그룹화
  const itemsByMonth = useMemo(() => {
    const grouped = {};
    
    Object.keys(itemsByDate).forEach((dateKey) => {
      const date = new Date(dateKey);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM 형식
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {};
      }
      grouped[monthKey][dateKey] = itemsByDate[dateKey];
    });
    
    // 월별로 정렬 (최신순)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b + '-01') - new Date(a + '-01'))
      .reduce((acc, month) => {
        acc[month] = grouped[month];
        return acc;
      }, {});
  }, [itemsByDate]);

  // 날짜 포맷팅 헬퍼
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const formatMonth = (monthKey) => {
    try {
      const [year, month] = monthKey.split('-');
      return `${parseInt(month)}월`;
    } catch (e) {
      return '';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '';
    }
  };

  const getDayOfWeek = (dateString) => {
    try {
      const date = new Date(dateString);
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()];
    } catch (e) {
      return '';
    }
  };

  // 날짜별 총액 계산
  const getDateTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = item.price || 0;
      return sum + price;
    }, 0);
  };

  // 구매 날짜/시간 포맷팅 헬퍼 (기존 호환성 유지)
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

  if (loading) return <div className='loading-state'>로딩 중...</div>;
  if (error) return <div className='error-state'>{error}</div>;
  if (!accountBook) return <div className='empty-state'>가계부를 찾을 수 없습니다.</div>;

  return (
    <div className='accountbook-view'>
      <h1 className='main-title'>가계부</h1>

      {/* 총 재산 섹션 */}
      <section className='asset-section'>
        <div className='asset-display'>
          <div className='asset-label'>총 재산 (현금 기준)</div>
          {showAssetEdit ? (
            <form onSubmit={handleUpdateAsset} className='asset-edit-form'>
              <input
                type='number'
                value={editAssetValue}
                onChange={(e) => setEditAssetValue(e.target.value)}
                placeholder='금액 입력'
                className='asset-input'
                autoFocus
                min='0'
                step='1'
              />
              <div className='asset-edit-actions'>
                <button type='submit' className='asset-confirm-button'>
                  확인
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowAssetEdit(false);
                    setEditAssetValue('');
                  }}
                  className='asset-cancel-button'
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className='asset-value-group'>
              <span className='asset-value'>
                {accountBook.totalAsset.toLocaleString()}원
              </span>
              <button
                className='asset-edit-button'
                onClick={() => {
                  setEditAssetValue(accountBook.totalAsset.toString());
                  setShowAssetEdit(true);
                }}
              >
                수정
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 예산 정보 */}
      {totalBudget > 0 && (
        <section className='budget-section'>
          <div className='section-header' onClick={() => setIsBudgetExpanded(!isBudgetExpanded)}>
            <h2 className='section-title' style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>예산 정보</h2>
            <button
              className='section-toggle-button'
              onClick={(e) => {
                e.stopPropagation();
                setIsBudgetExpanded(!isBudgetExpanded);
              }}
            >
              {isBudgetExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isBudgetExpanded && (
            <div className='budget-info'>
              <div className='budget-row'>
                <div className='budget-label'>사고 싶은 것에 필요한 총 예산</div>
                <div className='budget-value'>{wishItemsBudget.toLocaleString()}원</div>
              </div>
              <div className='budget-row'>
                <div className='budget-label'>프로젝트에 추가로 필요한 총 예산</div>
                <div className='budget-value'>{projectsBudget.toLocaleString()}원</div>
              </div>
              <div className='budget-row total'>
                <div className='budget-label'>총 필요한 예산</div>
                <div className='budget-value'>{totalBudget.toLocaleString()}원</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 사고 싶은 것 목록 */}
      <section className='wish-items-section'>
        <div className='section-header' onClick={() => setIsWishItemsExpanded(!isWishItemsExpanded)}>
          <h2 className='section-title' style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>사고 싶은 것</h2>
          <button
            className='section-toggle-button'
            onClick={(e) => {
              e.stopPropagation();
              setIsWishItemsExpanded(!isWishItemsExpanded);
            }}
          >
            {isWishItemsExpanded ? '▼' : '▶'}
          </button>
        </div>

        {isWishItemsExpanded && (
          <>
            <div className='wish-items-list'>
              {unpurchasedItems.length === 0 && (
                <p className='empty-message'>사고 싶은 것이 없습니다.</p>
              )}
              {unpurchasedItems.map((item) => (
                <div key={item._id} className='wish-item-row'>
                  {editingItemId === item._id ? (
                    // 수정 폼
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit(item._id);
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
                        style={{ width: '100px' }}
                        required
                      />
                      <button type='submit' className='item-edit-save-button' title='저장'>
                        ✓
                      </button>
                      <button
                        type='button'
                        onClick={handleCancelEdit}
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
                        <div className='item-price'>{item.price.toLocaleString()}원</div>
                      </div>
                      <button
                        className='item-edit-button'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(item);
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
              ))}
            </div>

            {/* 항목 추가 폼 */}
            {showItemForm ? (
              <form onSubmit={handleAddItem} className='item-add-form'>
                <div className='form-row'>
                  <input
                    type='text'
                    placeholder='이름'
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className='item-name-input'
                    autoFocus
                  />
                  <input
                    type='number'
                    placeholder='가격'
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className='item-price-input'
                    min='0'
                    step='1'
                    required
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
                + 사고 싶은 것 추가
              </button>
            )}
          </>
        )}
      </section>

      {/* 구매한 것 목록 - 캘린더 형태 */}
      {allPurchasedItems.length > 0 && (
        <section className='purchased-items-section'>
          <div className='section-header' onClick={() => setIsPurchasedItemsExpanded(!isPurchasedItemsExpanded)}>
            <h2 className='section-title' style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>구매한 것</h2>
            <button
              className='section-toggle-button'
              onClick={(e) => {
                e.stopPropagation();
                setIsPurchasedItemsExpanded(!isPurchasedItemsExpanded);
              }}
            >
              {isPurchasedItemsExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isPurchasedItemsExpanded && (
            <>
              {/* 구매날짜가 있는 항목들 - 캘린더 형태 */}
              {purchasedItemsWithDate.length > 0 && (
                <div className='purchased-calendar'>
                  {Object.keys(itemsByMonth).map((monthKey) => (
                    <div key={monthKey} className='month-section'>
                      <div className='month-header'>{formatMonth(monthKey)}</div>
                      {Object.keys(itemsByMonth[monthKey]).map((dateKey) => {
                        const items = itemsByMonth[monthKey][dateKey];
                        const dateTotal = getDateTotal(items);
                        const date = new Date(dateKey);
                        const dayOfWeek = getDayOfWeek(dateKey);
                        
                        return (
                          <div key={dateKey} className='date-card'>
                            <div className='date-header'>
                              <div className='date-info'>
                                <span className='date-day'>{date.getDate()}</span>
                                <span className='date-day-of-week'>{dayOfWeek}</span>
                              </div>
                              <div className='date-total'>
                                {dateTotal > 0 ? `-${dateTotal.toLocaleString()}원` : ''}
                              </div>
                            </div>
                            <div className='date-items'>
                              {items.map((item) => (
                                <div key={`${item.type}-${item._id}`} className='calendar-item'>
                                  <div className='calendar-item-content'>
                                    <div className='calendar-item-name'>
                                      {item.name}
                                      {item.type === 'project' && item.projectTitle && (
                                        <span className='calendar-item-project'> · {item.projectTitle}</span>
                                      )}
                                    </div>
                                    <div className='calendar-item-price'>
                                      {item.price ? `-${item.price.toLocaleString()}원` : ''}
                                    </div>
                                  </div>
                                  <div className='calendar-item-time'>{formatTime(item.purchasedDate)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* 구매날짜가 없는 항목들 */}
              {purchasedItemsWithoutDate.length > 0 && (
                <div className='purchased-items-no-date'>
                  <div className='no-date-header'>구매날짜 없음</div>
                  <div className='wish-items-list'>
                    {purchasedItemsWithoutDate.map((item) => (
                      <div key={`${item.type}-${item._id}`} className='wish-item-row purchased'>
                        {editingItemId === item._id ? (
                          // 수정 폼
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (item.type === 'wish') {
                                handleSaveEdit(item._id);
                              } else if (item.projectId) {
                                handleSaveEditProjectItem(item.projectId, item._id);
                              }
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
                              style={{ width: '100px' }}
                              required={item.type === 'wish'}
                            />
                            <button type='submit' className='item-edit-save-button' title='저장'>
                              ✓
                            </button>
                            <button
                              type='button'
                              onClick={handleCancelEdit}
                              className='item-edit-cancel-button'
                              title='취소'
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          // 일반 표시
                          <>
                            <div 
                              className='item-checkbox' 
                              onClick={() => {
                                if (item.type === 'wish') {
                                  handleItemToggle(item);
                                } else if (item.projectId) {
                                  handleProjectItemToggle(item.projectId, item);
                                }
                              }}
                            >
                              <input
                                type='checkbox'
                                checked={item.isPurchased}
                                readOnly
                                className='checkbox-input'
                              />
                            </div>
                            <div className='item-content'>
                              <div className='item-name'>
                                {item.name}
                                {item.type === 'project' && item.projectTitle && (
                                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                                    · {item.projectTitle}
                                  </span>
                                )}
                              </div>
                              {item.price && (
                                <div className='item-price'>{item.price.toLocaleString()}원</div>
                              )}
                            </div>
                            <button
                              className='item-edit-button'
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.type === 'wish') {
                                  handleStartEdit(item);
                                } else if (item.projectId) {
                                  handleStartEditProjectItem(item.projectId, item);
                                }
                              }}
                              style={{ marginRight: '8px' }}
                            >
                              ✏️
                            </button>
                            {item.type === 'wish' && (
                              <button
                                className='item-delete-button'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item._id, item.name);
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* 프로젝트 준비물 섹션 */}
      {projectsWithBudget.length > 0 && (
        <section className='projects-items-section'>
          <div className='section-header' onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
            <h2 className='section-title' style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>프로젝트 준비물</h2>
            <button
              className='section-toggle-button'
              onClick={(e) => {
                e.stopPropagation();
                setIsProjectsExpanded(!isProjectsExpanded);
              }}
            >
              {isProjectsExpanded ? '▼' : '▶'}
            </button>
          </div>
          {isProjectsExpanded && (
            <>
              {projectsWithBudget.map((project) => {
            // 프로젝트 예산 계산
            const projectBudget = project.items.reduce((sum, item) => {
              if (item.price !== null && item.price !== undefined) {
                return sum + (item.price || 0);
              }
              return sum;
            }, 0);

            // 프로젝트의 미구매 예산 계산
            const remainingProjectBudget = project.items
              .filter((item) => !item.isPurchased)
              .reduce((sum, item) => {
                if (item.price !== null && item.price !== undefined) {
                  return sum + (item.price || 0);
                }
                return sum;
              }, 0);

            return (
              <div key={project._id} className='project-items-block'>
                <div className='project-items-header'>
                  <h3 className='project-items-title'>{project.title}</h3>
                  <div className='project-items-budget'>
                    추가 예산: {remainingProjectBudget.toLocaleString()}원
                  </div>
                </div>
                <div className='project-items-list'>
                  {project.items
                    .filter((item) => item.price !== null && item.price !== undefined)
                    .map((item) => (
                      <div
                        key={item._id}
                        className={`project-item-row ${item.isPurchased ? 'purchased' : ''}`}
                      >
                        {editingItemId === `${project._id}-${item._id}` ? (
                          // 수정 폼
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveEditProjectItem(project._id, item._id);
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
                              onClick={handleCancelEdit}
                              className='item-edit-cancel-button'
                              title='취소'
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          // 일반 표시
                          <>
                            <div
                              className='item-checkbox'
                              onClick={() => handleProjectItemToggle(project._id, item)}
                            >
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
                                <div className='item-price'>
                                  {item.price.toLocaleString()}원
                                </div>
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
                        handleStartEditProjectItem(project._id, item);
                      }}
                      title='수정'
                    >
                      ✏️
                    </button>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              );
            })}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default AccountBookView;

