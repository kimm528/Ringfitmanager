import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import './Sidebar.css';  // 스타일을 적용

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, users }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(""); // 검색 상태
  const [sortOption, setSortOption] = useState("score"); // 정렬 옵션 (기본값: 운동 점수순)

  // 사용자 클릭 시 라우팅 처리
  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  // 이름으로 사용자 필터링
  const filteredUsers = users
    .filter(user => user.name.includes(searchTerm)) // 검색어에 해당하는 사용자 필터링
    .sort((a, b) => {
      if (sortOption === "score") {
        return b.score - a.score; // 운동 점수 높은 순으로 정렬
      } else if (sortOption === "bpm") {
        return b.bpm - a.bpm; // 현재 심박수 높은 순으로 정렬
      } else if (sortOption === "age") {
        return b.age - a.age; // 나이 높은 순으로 정렬
      } else if (sortOption === "name") {
        return a.name.localeCompare(b.name, 'ko'); // 이름 가나다 순으로 정렬
      }
      return 0;
    });

  return (
    <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20 sidebar-minimized'} bg-gray-800 text-white flex flex-col justify-between`}>
      {/* 상단 메뉴 버튼 */}
      <div className="flex items-center justify-between h-16 bg-gray-900 px-4">
        <span className={`text-xl font-bold ${isSidebarOpen ? 'block' : 'hidden'}`}>MENU</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? (
            <ChevronDoubleLeftIcon className="w-8 h-8" />
          ) : (
            <ChevronDoubleRightIcon className="w-12 h-8" />
          )}
        </button>
      </div>

      {/* 홈 버튼 */}
      <nav className="flex-1 p-4">
        <ul>
          <li className="mb-4">
            <Link to="/" className="flex items-center space-x-2">
              <HomeIcon className="w-12 h-8" />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Home</span>
            </Link>
          </li>
        </ul>

        {/* 검색 및 정렬 (사이드바가 열려 있을 때만 표시) */}
        {isSidebarOpen && (
          <>
            <div className="p-2">
              <input
                type="text"
                placeholder="이름 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-black rounded-lg"
              />
            </div>

            <div className="p-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full p-2 text-black rounded-lg"
              >
                <option value="score">운동 점수순</option>
                <option value="bpm">현재 심박수 순</option>
                <option value="age">나이 순</option>
                <option value="name">이름순</option> {/* 이름순 옵션 추가 */}
              </select>
            </div>
          </>
        )}

        {/* 사용자 목록 */}
        <div className={`mt-4 sidebar-scroll ${isSidebarOpen ? 'overflow-y-auto' : 'hide-scrollbar'} `}
             style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'scroll' }}>
          {filteredUsers.map(user => (
            <div 
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className="flex items-center p-2 cursor-pointer hover:bg-gray-700 rounded-lg"
            >
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className={`rounded-full ${isSidebarOpen ? 'w-8 h-8 mr-2' : 'w-8 h-8 mx-auto'}`} // 최소화 시 이미지 크기
              />
              <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-gray-400">{user.gender}, {user.age}세</p>
              </div>
            </div>
          ))}
        </div>

      </nav>

      {/* 하단에 Settings 항목 추가 */}
      <nav className="p-4">
        <ul>
          <li className="mb-4">
            <Link to="/settings" className="flex items-center space-x-2">
              <Cog6ToothIcon className="w-12 h-8" />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
