import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // 데이터 로드
  const fetchAccountBook = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccountBook();
      setAccountBook(data);
    } catch (err) {
      console.error('가계부 로드 실패:', err);
      setError('가계부 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
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

  // 사고 싶은 것에 필요한 총 예산 계산
  const wishItemsBudget = useMemo(() => {
    if (!accountBook || !accountBook.wishItems) return 0;
    return accountBook.wishItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [accountBook]);

  // 프로젝트에 필요한 총 예산 계산
  const projectsBudget = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    return projects.reduce((total, project) => {
      if (!project.items || project.items.length === 0) return total;
      const projectBudget = project.items.reduce((sum, item) => {
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

  // 예산이 0원보다 큰 프로젝트만 필터링
  const projectsWithBudget = useMemo(() => {
    return projects.filter((project) => {
      if (!project.items || project.items.length === 0) return false;
      const projectBudget = project.items.reduce((sum, item) => {
        if (item.price !== null && item.price !== undefined) {
          return sum + (item.price || 0);
        }
        return sum;
      }, 0);
      return projectBudget > 0;
    });
  }, [projects]);

  // 프로젝트 준비물 토글 핸들러
  const handleProjectItemToggle = async (projectId, item) => {
    try {
      await updateProjectItem(projectId, item._id, {
        isPurchased: !item.isPurchased,
      });
      fetchProjects(); // 프로젝트 목록 갱신
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
    try {
      await updateWishItem(item._id, {
        isPurchased: !item.isPurchased,
      });
      fetchAccountBook();
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

  // 사고 싶은 것 목록 분리
  const unpurchasedItems = accountBook?.wishItems?.filter((item) => !item.isPurchased) || [];
  const purchasedItems = accountBook?.wishItems?.filter((item) => item.isPurchased) || [];

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
          <div className='budget-info'>
            <div className='budget-row'>
              <div className='budget-label'>사고 싶은 것에 필요한 총 예산</div>
              <div className='budget-value'>{wishItemsBudget.toLocaleString()}원</div>
            </div>
            <div className='budget-row'>
              <div className='budget-label'>프로젝트에 필요한 총 예산</div>
              <div className='budget-value'>{projectsBudget.toLocaleString()}원</div>
            </div>
            <div className='budget-row total'>
              <div className='budget-label'>총 필요한 예산</div>
              <div className='budget-value'>{totalBudget.toLocaleString()}원</div>
            </div>
          </div>
        </section>
      )}

      {/* 사고 싶은 것 목록 */}
      <section className='wish-items-section'>
        <h2 className='section-title'>사고 싶은 것</h2>

        <div className='wish-items-list'>
          {unpurchasedItems.length === 0 && (
            <p className='empty-message'>사고 싶은 것이 없습니다.</p>
          )}
          {unpurchasedItems.map((item) => (
            <div key={item._id} className='wish-item-row'>
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
                className='item-delete-button'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item._id, item.name);
                }}
              >
                🗑️
              </button>
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
      </section>

      {/* 구매한 것 목록 */}
      {purchasedItems.length > 0 && (
        <section className='purchased-items-section'>
          <h2 className='section-title'>구매한 것</h2>
          <div className='wish-items-list'>
            {purchasedItems.map((item) => (
              <div key={item._id} className='wish-item-row purchased'>
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
                  className='item-delete-button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item._id, item.name);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 프로젝트 준비물 섹션 */}
      {projectsWithBudget.length > 0 && (
        <section className='projects-items-section'>
          <h2 className='section-title'>프로젝트 준비물</h2>
          {projectsWithBudget.map((project) => {
            // 프로젝트 예산 계산
            const projectBudget = project.items.reduce((sum, item) => {
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
                    총 예산: {projectBudget.toLocaleString()}원
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
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default AccountBookView;

