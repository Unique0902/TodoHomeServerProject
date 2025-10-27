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

function App() {
  return (
    <BrowserRouter>
      <div className='app-container'>
        {/* 메인 콘텐츠 영역 */}
        <main className='content'>
          <Routes>
            <Route path='/' element={<HomeView />} />
            <Route path='/todos' element={<TodosView />} />
            <Route path='/projects' element={<ProjectsView />} />
            <Route path='/habits' element={<HabitsView />} />
            <Route
              path='/habit-categories'
              element={<HabitCategorySelectView />}
            />
            <Route path='/wishlists' element={<WishlistView />} />
          </Routes>
        </main>

        {/* 하단 네비게이션 바 */}
        <Navbar />
      </div>
    </BrowserRouter>
  );
}

export default App;
