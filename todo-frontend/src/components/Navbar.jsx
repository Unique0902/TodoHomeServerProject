// src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'; // CSS 파일을 별도로 만들어 스타일 적용 (3번 섹션 참고)

// 임시 아이콘 (실제 구현 시 라이브러리 아이콘으로 대체 가능)
const icons = {
  Home: '🏠',
  Todos: 'V',
  Projects: '💡',
  Habits: '🔗', // 임시로 습관을 나타내는 아이콘
  Wishlist: '🤍',
  AccountBook: '💰',
};

const Navbar = () => {
  // 네비게이션 항목 정의 (이 순서가 바의 순서가 됨)
  const navItems = [
    { name: '홈', path: '/', icon: icons.Home },
    { name: '할일', path: '/todos', icon: icons.Todos },
    { name: '프로젝트', path: '/projects', icon: icons.Projects },
    { name: '습관', path: '/habits', icon: icons.Habits },
    { name: '위시리스트', path: '/wishlists', icon: icons.Wishlist },
    { name: '가계부', path: '/accountbook', icon: icons.AccountBook },
  ];

  return (
    <nav className='navbar'>
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            isActive ? 'nav-item active' : 'nav-item'
          }
        >
          <div className='nav-icon'>{item.icon}</div>
          <div className='nav-label'>{item.name}</div>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;
