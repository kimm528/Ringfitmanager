// src/components/Sidebar.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowRightOnRectangleIcon,
  DeviceTabletIcon // 추가된 아이콘
} from "@heroicons/react/24/outline";
// import './Sidebar.css'; // 제거 또는 필요 시 유지
import Modal from './Modal';
import { openDB } from 'idb'; // IndexedDB를 위한 idb 라이브러리
import Cookies from 'js-cookie'; // js-cookie 임포트

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  users,
  setIsLoggedIn,
  sortOption,
  setSortOption,
  siteId, // siteId prop
  resetState, // resetState prop 추가
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 캐시 삭제 함수
  const clearFloorPlanCache = useCallback(async () => {
    if (!siteId) {
      console.error('siteId가 제공되지 않았습니다. 캐시를 삭제할 수 없습니다.');
      return;
    }

    try {
      const db = await openDB('FloorPlanDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('floorPlans')) {
            db.createObjectStore('floorPlans');
          }
        },
      });
      await db.delete('floorPlans', siteId); // 특정 siteId의 배치도 삭제
      console.log('캐시가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('캐시 삭제 오류:', error);
    }
  }, [siteId]);

  const handleLogout = useCallback(async () => {
    // 쿠키에서 로그인 관련 데이터 삭제 (domain 속성 추가)
    Cookies.remove("isLoggedIn", { domain: '.dotories.com' });
    Cookies.remove("siteId", { domain: '.dotories.com' });
    Cookies.remove("adminId", { domain: '.dotories.com' });

    // 캐시 삭제
    if (siteId) {
      await clearFloorPlanCache();
    }

    // 상태 초기화
    resetState(); // 상태 초기화 호출

    // 로그인 상태 업데이트
    setIsLoggedIn(false);

    // 홈 화면으로 리다이렉트
    navigate('/');
  }, [setIsLoggedIn, navigate, clearFloorPlanCache, siteId, resetState]);

  // 정렬된 사용자 리스트
  const sortedUsers = useMemo(() => {
    let sorted = [...users].filter(user => user && user.name);
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
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    }
    return sorted;
  }, [users, sortOption]);

  // 반응형 사이드바 처리
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUserClick = useCallback((userId) => {
    navigate(`/users/${userId}`);
  }, [navigate]);

  if (isMobile) {
    return null;
  }

  const isFloorPlan = location.pathname === '/floorplan';

  return (
    <>
      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <Modal onClose={() => setShowLogoutModal(false)}>
          <div className="text-center">
            <p className="mb-4">로그아웃 하시겠습니까?</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md mr-2"
              aria-label="로그아웃 확인 버튼"
            >
              로그아웃
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 bg-gray-300 rounded-md"
              aria-label="로그아웃 취소 버튼"
            >
              취소
            </button>
          </div>
        </Modal>
      )}

      <aside
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-30 sidebar-minimized'
        } bg-gray-800 text-white flex flex-col justify-between`} // 상단에만 2rem 패딩 추가
        style={{ height: '100vh', overflowY: 'auto' }} // height 고정 및 스크롤 설정
      >
        {/* 로고 이미지 */}
        <div
          className={`bg-white p-2 h-20 cursor-pointer`}
          onClick={handleLogoClick}
        >
          <img
            src={`${process.env.PUBLIC_URL}/AiFitLogoBgRmv.png`}
            alt="Home Icon"
            className="w-16 h-16 ml-2"
          />
        </div>

        {/* 상단 메뉴 버튼 */}
        <div
          className={`flex items-center justify-between ${
            isSidebarOpen ? 'h-16' : 'h-12'
          } bg-gray-900 px-4`} // 사이드바가 열리면 높이를 4rem로, 축소되면 3rem로 설정
        >
          <span className={`text-xl font-bold ${isSidebarOpen ? 'block' : 'hidden'} mt-5 mb-5 flex items-center`}>
            MENU
          </span>
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
            }}
            aria-label={isSidebarOpen ? "사이드바 축소 버튼" : "사이드바 확장 버튼"}
          >
            {isSidebarOpen ? (
              <ChevronDoubleLeftIcon className="w-8 h-8" />
            ) : (
              <ChevronDoubleRightIcon className="w-12 h-8 ml-4" />
            )}
          </button>
        </div>

        {/* 네비게이션 링크 */}
        <nav className="flex-1 p-4">
          <ul>
            <li className={`${isSidebarOpen ? 'mb-4' : 'mb-4 ml-4'}`}>
              <Link to="/" className="flex items-center space-x-2">
                <HomeIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Home</span>
              </Link>
            </li>
            {/* 새로운 "기기 관리" 탭 추가 */}
            <li className={`${isSidebarOpen ? 'mb-4' : 'mb-4 ml-4'}`}>
              <Link to="/devices" className="flex items-center space-x-2">
                <DeviceTabletIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>기기 관리</span>
              </Link>
            </li>
            <li className={`${isSidebarOpen ? 'mb-4' : 'mb-4 ml-4'}`}>
              <a
                href="https://botfit.dotories.com" // 외부 URL로 변경
                rel="noopener noreferrer" // 보안 및 성능 향상
                className="flex items-center space-x-2 text-blue-500 underline hover:text-blue-700"
              >
                <DeviceTabletIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>BotFit</span>
              </a>
            </li>
          </ul>

          {/* 정렬 옵션 */}
          {isSidebarOpen && (
            <div className="p-4">
              <label
                htmlFor="sortOptions"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                정렬 옵션
              </label>
              <select
                id="sortOptions"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="block w-full p-2 rounded-lg bg-gray-700 text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="score">운동 점수 순</option>
                <option value="bpm">현재 심박수 순</option>
                <option value="age">나이 순</option>
                <option value="name">이름 순</option>
              </select>
            </div>
          )}

          {/* 사용자 리스트 */}
          <div
            className={`mt-4 sidebar-scroll ${isSidebarOpen ? 'overflow-y-auto' : 'hide-scrollbar'}`}
            style={{ maxHeight: 'calc(80vh - 350px)', overflowY: 'auto' }}
          >
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-700 rounded-lg"
                aria-label={`사용자 ${user.name} 프로필 보기`}
              >
                <div className="block">
                  <p className="text-sm">{user.name}</p>
                  {isSidebarOpen && (
                    <p className="text-xs text-gray-400">
                      {user.gender === 0 ? '남성' : '여성'}, {user.age}세
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* 하단 네비게이션: 설정 및 로그아웃 */}
        <nav className="p-4">
          <ul>
            <li className={`${isSidebarOpen ? 'mb-4' : 'mb-4 ml-4'}`}>
              <Link to="/settings" className="flex items-center space-x-2">
                <Cog6ToothIcon className="w-12 h-8" />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
              </Link>
            </li>
            <li className={`${isSidebarOpen ? 'mb-4' : 'mb-4 ml-4'}`}>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center space-x-2"
                aria-label="로그아웃 버튼"
              >
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
