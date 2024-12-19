// src/components/Sidebar.js

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  Cog6ToothIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  DeviceTabletIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { LiaRingSolid } from "react-icons/lia";
import { GiRobotLeg } from "react-icons/gi";
import './Sidebar.css';
import Modal from './Modal';
import { openDB } from 'idb';
import Cookies from 'js-cookie';

const Sidebar = ({
  isSidebarOpen,
  users,
  setIsLoggedIn,
  sortOption,
  siteId,
  resetState,
  toggleSidebar
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [botfitExpanded, setBotfitExpanded] = useState(true);
  const [ringExpanded, setRingExpanded] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // 모바일 뷰 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      
      // 실제 보이는 화면 높이 계산
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      setViewportHeight(vh);
    };

    // visualViewport 이벤트 리스너 추가
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 초기 실행
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
      await db.delete('floorPlans', siteId);
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

    resetState();

    // 로그인 상태 업데이트
    setIsLoggedIn(false);

    // 홈 화면으로 다이렉트
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

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUserClick = useCallback((userId) => {
    navigate(`/users/${userId}`);
    if (isMobileView) {
      toggleSidebar();
    }
  }, [navigate, isMobileView, toggleSidebar]);

  const handleMenuClick = useCallback((path) => {
    navigate(path);
    if (isMobileView) {
      toggleSidebar();
    }
  }, [navigate, isMobileView, toggleSidebar]);

  // 모바일에서 사이드바 외부 클릭 시 닫기
  const handleOutsideClick = useCallback((e) => {
    if (isMobileView && isSidebarOpen && e.target.classList.contains('sidebar-overlay')) {
      toggleSidebar();
    }
  }, [isMobileView, isSidebarOpen, toggleSidebar]);

  return (
    <>
      {/* 모바일 오버레이 배경 */}
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 sidebar-overlay"
          onClick={handleOutsideClick}
          style={{ 
            height: `${viewportHeight}px`,
            top: '80px'
          }}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed md:relative
          ${isMobileView ? 'top-[80px]' : 'top-20'}
          left-0 
          ${isSidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-0'}
          transition-all duration-300 ease-in-out
          bg-gray-50 text-gray-700 shadow-lg
          ${isMobileView ? 'z-[1000] w-64' : 'z-30'}
          overflow-y-auto
        `}
        style={{
          height: isMobileView 
            ? `${Math.max(viewportHeight - 80, document.documentElement.clientHeight - 80)}px`
            : 'calc(100vh - 80px)',
          maxHeight: '100%'
        }}
      >
        {/* 전체 컨테이너 */}
        <div className="flex flex-col h-full">
          {/* 트리 메뉴 영역 */}
          <div className="p-4 flex-shrink-0">
            {/* BotFit 섹션 */}
            <div className="mb-4 border-b border-gray-200 pb-2">
              <div
                onClick={() => setBotfitExpanded(!botfitExpanded)}
                className="flex items-center justify-between w-full p-2 cursor-pointer hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center">
                  {isSidebarOpen && (
                    <span className="ml-3 text-[18px] font-bold">BotFit Pro</span>
                  )}
                </div>
                {isSidebarOpen && (
                  botfitExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />
                )}
              </div>
              {botfitExpanded && isSidebarOpen && (
                <ul className="ml-8 mt-2 space-y-2">
                  <li>
                    <a href="https://botfit.dotories.com" className="flex items-center p-2 hover:bg-gray-100 rounded-lg">
                      <HomeIcon className="w-5 h-5" />
                      <span className="ml-3">Home</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/setting-training" className="flex items-center p-2 hover:bg-gray-100 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5" />
                      <span className="ml-3">운동 프로그램 관리</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/botfit-management" className="flex items-center p-2 hover:bg-gray-100 rounded-lg">
                      <GiRobotLeg className="w-5 h-5" />
                      <span className="ml-3">봇핏 관리</span>
                    </a>
                  </li>
                </ul>
              )}
            </div>

            {/* Ring 섹션 */}
            <div className="mb-4 border-b border-gray-200 pb-2">
              <div
                onClick={() => setRingExpanded(!ringExpanded)}
                className="flex items-center justify-between w-full p-2 cursor-pointer hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center">
                  {isSidebarOpen && <span className="ml-3 text-[18px] font-bold">Ring</span>}
                </div>
                {isSidebarOpen && (
                  ringExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />
                )}
              </div>
              {ringExpanded && isSidebarOpen && (
                <ul className="ml-8 mt-2 space-y-2">
                  <li>
                    <button
                      onClick={() => handleMenuClick('/')}
                      className={`flex items-center p-2 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <HomeIcon className="w-5 h-5" />
                      <span className="ml-3">Home</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleMenuClick('/devices')}
                      className={`flex items-center p-2 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/devices' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <LiaRingSolid className="w-5 h-5" />
                      <span className="ml-3">기기 관리</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* 사용자 리스트 영역 */}
          <div className={`
            px-4 flex-1
            ${isMobileView ? 'hidden' : 'overflow-y-auto'}
          `}>
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors duration-200 mb-2"
              >
                <div className="block">
                  <p className="text-sm">{user.name}</p>
                  {isSidebarOpen && (
                    <p className="text-xs text-gray-500">
                      {user.gender === 0 ? '남성' : '여성'}, {user.age}세
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => handleMenuClick('/settings')}
              className={`flex items-center w-full p-2 rounded-lg transition-colors duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Cog6ToothIcon className="w-6 h-6" />
              {isSidebarOpen && <span className="ml-3">설정</span>}
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center w-full p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-700"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              {isSidebarOpen && <span className="ml-3">로그아웃</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 로그아웃 모달 */}
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
    </>
  );
};

export default Sidebar;
