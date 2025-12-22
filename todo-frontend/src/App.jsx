// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
// 뷰 컴포넌트 임포트 (아래에 Placeholders로 정의 예정)
import HomeView from './views/HomeView';
import TodosView from './views/TodosView';
import ProjectsView from './views/ProjectsView';
import HabitsView from './views/HabitsView';
import WishlistView from './views/WishlistView';
import HabitCategorySelectView from './views/HabitCategorySelectView';
import TodoAddView from './views/TodoAddView'; // 새 임포트
import TodoDetailView from './views/TodoDetailView'; // 새 임포트
import TodoEditView from './views/TodoEditView'; // 새 임포트
import HabitAddView from './views/HabitAddView'; // 새 임포트
import HabitDetailView from './views/HabitDetailView'; // 새 임포트
import ProjectAddView from './views/ProjectAddView'; // 새 임포트
import ProjectDetailView from './views/ProjectDetailView'; // 새 임포트
import WishlistAddView from './views/WishlistAddView'; // 새 임포트
import WishlistDetailView from './views/WishlistDetailView'; // 새 임포트

function App() {
  return (
    <BrowserRouter>
      <div className='app-container'>
        {/* 메인 콘텐츠 영역 */}
        <main className='content'>
          <Routes>
            <Route path='/' element={<HomeView />} />
            <Route path='/todos' element={<TodosView />} />
            <Route path='/todos/add' element={<TodoAddView />} />
            <Route path='/todos/:id' element={<TodoDetailView />} />{' '}
            {/* 상세 페이지 */}
            <Route path='/todos/:id/edit' element={<TodoEditView />} />{' '}
            {/* 수정 페이지 */}
            <Route path='/projects' element={<ProjectsView />} />
            <Route path='/projects/add' element={<ProjectAddView />} />
            <Route path='/projects/:id' element={<ProjectDetailView />} />
            <Route
              path='/projects/:id/edit'
              element={<ProjectAddView />}
            />{' '}
            {/* 수정은 AddView 재사용 */}
            <Route path='/habits' element={<HabitsView />} />
            <Route
              path='/habit-categories'
              element={<HabitCategorySelectView />}
            />
            <Route path='/habits/add' element={<HabitAddView />} />
            <Route path='/habits/:id' element={<HabitDetailView />} />
            <Route path='/habits/:id/edit' element={<HabitAddView />} />{' '}
            {/* 수정은 AddView 재사용 예정 */}
            <Route path='/wishlists' element={<WishlistView />} />
            <Route path='/wishlists/add' element={<WishlistAddView />} />
            <Route path='/wishlists/:id' element={<WishlistDetailView />} />
            <Route path='/wishlists/:id/edit' element={<WishlistAddView />} />
          </Routes>
        </main>

        {/* 하단 네비게이션 바 */}
        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default App;
