# 데이터베이스 ERD (Entity Relationship Diagram)

## 개요

이 문서는 Todo 프로젝트의 MongoDB 데이터베이스 스키마 구조를 설명합니다.

## 엔티티 (Entities)

### 1. Todo (할일)

할일을 관리하는 엔티티입니다.

| 필드명      | 타입     | 필수 | 설명                                  |
| ----------- | -------- | ---- | ------------------------------------- |
| \_id        | ObjectId | ✅   | 고유 식별자 (자동 생성)               |
| title       | String   | ✅   | 할일 제목                             |
| description | String   | ❌   | 할일 설명 (기본값: '')                |
| isCompleted | Boolean  | ❌   | 완료 여부 (기본값: false)             |
| dueDate     | Date     | ❌   | 기한 (날짜와 시간 통합, 선택사항)     |
| projectId   | String   | ❌   | 연결된 프로젝트 ID (참조용, 선택사항) |
| createdAt   | Date     | ✅   | 생성일시 (자동 생성)                  |
| updatedAt   | Date     | ✅   | 수정일시 (자동 갱신)                  |

**관계:**

- `projectId` → Project (선택적 참조, String 타입)

---

### 2. Project (프로젝트)

프로젝트를 관리하는 엔티티입니다.

| 필드명      | 타입     | 필수 | 설명                       |
| ----------- | -------- | ---- | -------------------------- |
| \_id        | ObjectId | ✅   | 고유 식별자 (자동 생성)    |
| title       | String   | ✅   | 프로젝트 제목              |
| description | String   | ❌   | 프로젝트 설명 (기본값: '') |
| isCompleted | Boolean  | ❌   | 완료 여부 (기본값: false)  |
| createdAt   | Date     | ✅   | 생성일시 (자동 생성)       |
| updatedAt   | Date     | ✅   | 수정일시 (자동 갱신)       |

**관계:**

- 일대다 (1:N): 하나의 프로젝트는 여러 개의 할일(Todo)을 가질 수 있음
- 역참조: Todo의 `projectId`로 연결됨

---

### 3. HabitCategory (습관 카테고리)

습관을 분류하는 카테고리를 관리하는 엔티티입니다.

| 필드명        | 타입        | 필수 | 설명                                     |
| ------------- | ----------- | ---- | ---------------------------------------- |
| \_id          | ObjectId    | ✅   | 고유 식별자 (자동 생성)                  |
| title         | String      | ✅   | 카테고리 제목                            |
| selectedDates | Array[Date] | ❌   | 카테고리가 선택된 날짜 배열 (기본값: []) |
| createdAt     | Date        | ✅   | 생성일시 (자동 생성)                     |
| updatedAt     | Date        | ✅   | 수정일시 (자동 갱신)                     |

**관계:**

- 일대다 (1:N): 하나의 카테고리는 여러 개의 습관(Habit)을 가질 수 있음
- 역참조: Habit의 `habitCategoryId`로 연결됨

---

### 4. Habit (습관)

습관을 관리하는 엔티티입니다.

| 필드명          | 타입        | 필수 | 설명                                 |
| --------------- | ----------- | ---- | ------------------------------------ |
| \_id            | ObjectId    | ✅   | 고유 식별자 (자동 생성)              |
| title           | String      | ✅   | 습관 제목                            |
| description     | String      | ❌   | 습관 설명 (기본값: '')               |
| habitCategoryId | String      | ✅   | 연결된 습관 카테고리 ID              |
| completedDates  | Array[Date] | ❌   | 습관을 완료한 날짜 배열 (기본값: []) |
| createdAt       | Date        | ✅   | 생성일시 (자동 생성)                 |
| updatedAt       | Date        | ✅   | 수정일시 (자동 갱신)                 |

**관계:**

- `habitCategoryId` → HabitCategory (필수 참조, String 타입)

---

### 5. Wishlist (위시리스트)

위시리스트를 관리하는 엔티티입니다.

| 필드명      | 타입     | 필수 | 설명                         |
| ----------- | -------- | ---- | ---------------------------- |
| \_id        | ObjectId | ✅   | 고유 식별자 (자동 생성)      |
| title       | String   | ✅   | 위시리스트 제목              |
| description | String   | ❌   | 위시리스트 설명 (기본값: '') |
| isCompleted | Boolean  | ❌   | 달성 여부 (기본값: false)    |
| createdAt   | Date     | ✅   | 생성일시 (자동 생성)         |
| updatedAt   | Date     | ✅   | 수정일시 (자동 갱신)         |

**관계:**

- 독립적인 엔티티 (다른 엔티티와의 관계 없음)

---

## 엔티티 관계도 (Entity Relationship Diagram)

```
┌─────────────┐
│   Project   │
│─────────────│
│ _id         │
│ title       │◄──────┐
│ description │       │
│ isCompleted │       │
│ createdAt   │       │
│ updatedAt   │       │
└─────────────┘       │
                      │ 1:N (projectId)
                      │
┌─────────────┐       │
│    Todo     │       │
│─────────────│       │
│ _id         │       │
│ title       │       │
│ description │       │
│ isCompleted │       │
│ dueDate     │       │
│ projectId   │───────┘
│ createdAt   │
│ updatedAt   │
└─────────────┘

┌─────────────────┐
│ HabitCategory   │
│─────────────────│
│ _id             │
│ title           │◄──────┐
│ selectedDates[] │       │
│ createdAt       │       │
│ updatedAt       │       │
└─────────────────┘       │
                          │ 1:N (habitCategoryId)
                          │
┌─────────────┐           │
│    Habit    │           │
│─────────────│           │
│ _id         │           │
│ title       │           │
│ description │           │
│ habitCategoryId│────────┘
│ completedDates[]│
│ createdAt   │
│ updatedAt   │
└─────────────┘

┌─────────────┐
│  Wishlist   │
│─────────────│
│ _id         │
│ title       │
│ description │
│ isCompleted │
│ createdAt   │
│ updatedAt   │
└─────────────┘
   (독립적)
```

## 관계 설명

### 1. Project ↔ Todo

- **관계 유형:** 일대다 (1:N)
- **방향:** Project → Todo (하나의 프로젝트는 여러 할일을 가짐)
- **구현:** Todo의 `projectId` 필드에 Project의 `_id`를 String 타입으로 저장
- **특징:**
  - 선택적 관계 (projectId는 null일 수 있음)
  - MongoDB ObjectId 참조가 아닌 String 타입 사용
  - 카스케이드 삭제 없음 (프로젝트 삭제 시 할일은 별도 처리 필요)

### 2. HabitCategory ↔ Habit

- **관계 유형:** 일대다 (1:N)
- **방향:** HabitCategory → Habit (하나의 카테고리는 여러 습관을 가짐)
- **구현:** Habit의 `habitCategoryId` 필드에 HabitCategory의 `_id`를 String 타입으로 저장
- **특징:**
  - 필수 관계 (habitCategoryId는 required)
  - MongoDB ObjectId 참조가 아닌 String 타입 사용
  - 카테고리 삭제 시 관련 습관도 함께 삭제됨 (백엔드 로직에서 처리)

### 3. Wishlist

- **독립적인 엔티티:** 다른 엔티티와의 관계가 없음

## 배열 필드 설명

### HabitCategory.selectedDates

- **타입:** Array[Date]
- **용도:** 해당 카테고리가 선택되어 활성화된 날짜들을 저장
- **예시:** `["2025-01-15T00:00:00.000Z", "2025-01-16T00:00:00.000Z"]`

### Habit.completedDates

- **타입:** Array[Date]
- **용도:** 해당 습관이 완료된 날짜들을 저장
- **예시:** `["2025-01-15T00:00:00.000Z", "2025-01-16T00:00:00.000Z"]`

## 참고 사항

1. **타임스탬프:** 모든 엔티티는 `timestamps: true` 옵션으로 `createdAt`과 `updatedAt` 필드가 자동으로 관리됩니다.

2. **참조 방식:**

   - MongoDB의 ObjectId 참조가 아닌 String 타입을 사용하여 참조 관계를 구현합니다.
   - 이는 더 간단한 구조이지만, 참조 무결성 검증은 애플리케이션 레벨에서 처리해야 합니다.

3. **카스케이드 삭제:**

   - HabitCategory 삭제 시 관련 Habit들도 함께 삭제됩니다 (백엔드 로직 구현됨)
   - Project 삭제 시 관련 Todo들은 자동으로 삭제되지 않습니다 (별도 처리 필요)

4. **인덱스:**
   - 기본적으로 MongoDB는 `_id` 필드에 자동 인덱스를 생성합니다.
   - 자주 조회되는 필드(`projectId`, `habitCategoryId`, `dueDate` 등)에 대한 인덱스 추가를 고려할 수 있습니다.

## 데이터베이스 정보

- **DBMS:** MongoDB
- **ODM:** Mongoose
- **타임스탬프:** 모든 엔티티에 자동 적용

