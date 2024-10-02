// Sidebar.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { HomeIcon, Cog6ToothIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import './Sidebar.css';
import Modal from './Modal';

const Sidebar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  users, 
  setIsLoggedIn, 
  sortOption, 
  setSortOption, 
  searchQuery, 
  setSearchQuery 
}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Memoized sorted users based on sortOption
  const sortedUsers = useMemo(() => {
    let sorted = [...users];
    switch (sortOption) {
      case "score":
        sorted.sort((a, b) => {
          const aGoal = a.goals?.stepsGoal || 1;
          const bGoal = b.goals?.stepsGoal || 1;
          const aAchievement = (a.data?.steps || 0) / aGoal;
          const bAchievement = (b.data?.steps || 0) / bGoal;
          return bAchievement - aAchievement;
        });
        break;
      case "bpm":
        sorted.sort((a, b) => (b.data?.bpm || 0) - (a.data?.bpm || 0));
        break;
      case "age":
        sorted.sort((a, b) => b.age - a.age);
        break;
      case "name":
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return sorted;
  }, [users, sortOption]);

  // Handle Responsive Sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigate to User Detail
  const handleUserClick = useCallback((userId) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  // Logout Handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    navigate('/');
  }, [setIsLoggedIn, navigate]);

  // If Mobile, do not render Sidebar
  if (isMobile) {
    return null;
  }



  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <Modal onClose={() => setShowLogoutModal(false)}>
          <div className="text-center">
            <p className="mb-4">로그아웃 하시겠습니까?</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md mr-2"
            >
              로그아웃
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 bg-gray-300 rounded-md"
            >
              취소
            </button>
          </div>
        </Modal>
      )}

      <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20 sidebar-minimized'} bg-gray-800 text-white flex flex-col justify-between`}>
        {/* Top Menu Button */}
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

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul>
            <li className="mb-4">
              <Link to="/" className="flex items-center space-x-2">
                <HomeIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Home</span>
              </Link>
            </li>
          </ul>

          {/* Search and Sort Options */}
          {isSidebarOpen && (
            <>
              {/* Search Box */}
              <div className="p-2">
                <label htmlFor="nameSearch" className="block text-sm font-medium text-gray-300 mb-2">이름 검색</label>
                <input
                  id="nameSearch"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sort Options */}
              <div className="p-4">
                <label htmlFor="sortOptions" className="block text-sm font-medium text-gray-300 mb-2">정렬 옵션</label>
                <select
                  id="sortOptions"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="block w-full p-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="score">운동 점수 순</option>
                  <option value="bpm">현재 심박수 순</option>
                  <option value="age">나이 순</option>
                  <option value="name">이름 순</option>
                </select>
              </div>
            </>
          )}

          {/* User List */}
          <div className={`mt-4 sidebar-scroll ${isSidebarOpen ? 'overflow-y-auto' : 'hide-scrollbar'}`} style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'scroll' }}>
            {sortedUsers.map(user => (
              <div 
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-700 rounded-lg"
              >
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  className={`rounded-full ${isSidebarOpen ? 'w-8 h-8 mr-2' : 'w-8 h-8 mx-auto'}`}
                />
                <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.gender}, {user.age}세</p>
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Navigation: Settings and Logout */}
        <nav className="p-4">
          <ul>
            <li className="mb-4">
              <Link to="/settings" className="flex items-center space-x-2">
                <Cog6ToothIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
              </Link>
            </li>
            <li className="mb-4">
              <button onClick={() => setShowLogoutModal(true)} className="flex items-center space-x-2">
                <ArrowRightOnRectangleIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
