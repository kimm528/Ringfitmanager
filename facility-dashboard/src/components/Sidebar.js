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
  UsersIcon,
  UserIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { LiaRingSolid } from "react-icons/lia";
import { GiRobotLeg } from "react-icons/gi";
import './Sidebar.css';
import Modal from './Modal';
import { openDB } from 'idb';
import Cookies from 'js-cookie';
import { FaRobot, FaHeartbeat } from 'react-icons/fa';

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
  const [userExpanded, setUserExpanded] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // 모바일 뷰 감지
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일에서 사이드바 열릴 때 body 스크롤 제어
  useEffect(() => {
    if (isMobileView && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileView, isSidebarOpen]);

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
          style={{ top: '80px' }}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          ${isMobileView ? 'fixed top-[5rem] h-[calc(100dvh-5rem-env(safe-area-inset-bottom))]' : 'relative h-[calc(100vh-5rem)] mt-[5rem]'}
          left-0 
          transition-all duration-300 ease-in-out
          bg-gray-50 text-gray-700 shadow-lg
          ${isMobileView ? 'z-[1000]' : 'z-30'}
          overflow-y-auto
        `}
        style={{
          fontSize: '1rem',
          width: isSidebarOpen ? '16rem' : '0',
          minWidth: isSidebarOpen ? '16rem' : '0',
          maxWidth: isSidebarOpen ? '16rem' : '0',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* 전체 컨테이너 */}
        <div className="flex flex-col h-full">
          {/* 트리 메뉴 영역 */}
          <div className="p-2 flex-shrink-0">
            {/* BotFit 섹션 */}
            <div className="mb-4">
              <div
                onClick={() => setBotfitExpanded(!botfitExpanded)}
                className="flex items-center justify-between w-full p-2 cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  {isSidebarOpen && (
                    <span className="ml-2 text-[18px] font-bold text-gray-700">BotFit Pro</span>
                  )}
                </div>
                {isSidebarOpen && (
                  botfitExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />
                )}
              </div>
              {botfitExpanded && isSidebarOpen && (
                <ul className="ml-6 mt-1 space-y-0.5">
                  <li>
                    <a href="https://botfit.dotories.com" className="flex items-center p-1.5 hover:bg-gray-100 rounded-lg">
                      <HomeIcon className="w-7 h-7" />
                      <span className="ml-2">Home</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/user-management" className="flex items-center p-1.5 hover:bg-gray-100 rounded-lg">
                      <img src="/users.svg" alt="users" className="w-7 h-7 [filter:brightness(0)_saturate(100%)_invert(45%)_sepia(11%)_saturate(372%)_hue-rotate(182deg)_brightness(94%)_contrast(87%)]" />
                      <span className="ml-2">사용자 정보</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/custom-program" className="flex items-center p-1.5 hover:bg-gray-100 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-7 h-7" />
                      <span className="ml-2">운동 프로그램 관리</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/botfit-management" className="flex items-center p-1.5 hover:bg-gray-100 rounded-lg">
                      <GiRobotLeg className="w-7 h-7" />
                      <span className="ml-2">봇핏 관리</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://botfit.dotories.com/exercise-report" className="flex items-center p-1.5 hover:bg-gray-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3.75h3.75M9 15h3.75M9 12h3.75m3-3h3.75m-3 3h3.75m-3 3h3.75M6.75 3h.008v.008h-.008V3Z" />
                      </svg>                      <span className="ml-2">운동 리포트</span>
                    </a>
                  </li>
                </ul>
              )}
            </div>
            <div className="border-b border-gray-200" />

            {/* Ring 섹션 */}
            <div className="mb-4">
              <div
                onClick={() => setRingExpanded(!ringExpanded)}
                className="flex items-center justify-between w-full p-2 cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  {isSidebarOpen && (
                    <span className="ml-2 text-[18px] font-bold text-gray-700">Ring</span>
                  )}
                </div>
                {isSidebarOpen && (
                  ringExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />
                )}
              </div>
              {ringExpanded && isSidebarOpen && (
                <ul className="ml-6 mt-1 space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleMenuClick('/')}
                      className={`flex items-center p-1.5 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <HomeIcon className="w-7 h-7" />
                      <span className="ml-2">Home</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleMenuClick('/devices')}
                      className={`flex items-center p-1.5 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/devices' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <LiaRingSolid className="w-7 h-7" />
                      <span className="ml-2">기기 관리</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleMenuClick('/health-report')}
                      className={`flex items-center p-1.5 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/health-report' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3.75h3.75M9 15h3.75M9 12h3.75m3-3h3.75m-3 3h3.75m-3 3h3.75M6.75 3h.008v.008h-.008V3Z" />
                      </svg>
                      <span className="ml-2">건강 리포트</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* User 섹션 */}
            <div className="mb-4">
              <div
                onClick={() => setUserExpanded(!userExpanded)}
                className="flex items-center justify-between w-full p-2 cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-lg mb-2"
              >
                <div className="flex items-center">
                  {isSidebarOpen && (
                    <span className="ml-2 text-[18px] font-bold text-gray-700">User</span>
                  )}
                </div>
                {isSidebarOpen && (
                  userExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />
                )}
              </div>
              {userExpanded && isSidebarOpen && (
                <ul className="ml-6 mt-1 space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleMenuClick('/user-management')}
                      className={`flex items-center p-1.5 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/user-management' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <UserIcon className="w-7 h-7" />
                      <span className="ml-2">사용자 관리</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleMenuClick('/assign-users')}
                      className={`flex items-center p-1.5 w-full hover:bg-gray-100 rounded-lg ${
                        location.pathname === '/assign-users' ? 'text-[#594AE2]' : ''
                      }`}
                    >
                      <UsersIcon className="w-7 h-7" />
                      <span className="ml-2">관리자 할당</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* 사용자 리스트 영역 */}
          <div className={`
            px-4 flex-grow
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
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 mt-auto">
            <div className="flex justify-between gap-2">
              <button
                onClick={() => handleMenuClick('/settings')}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 flex-1 justify-center ${
                  location.pathname === '/settings'
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Cog6ToothIcon className="w-5 h-5" />
                {isSidebarOpen && <span className="mt-1 text-xs whitespace-nowrap">설정</span>}
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-700 flex-1 justify-center"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {isSidebarOpen && <span className="mt-1 text-xs whitespace-nowrap">로그아웃</span>}
              </button>
            </div>
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
