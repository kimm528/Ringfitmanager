import React, { useState, useCallback, useEffect } from 'react';
import { VscGraph } from "react-icons/vsc";  
import { CiBoxList } from "react-icons/ci";  
import { AiOutlineClose } from "react-icons/ai"; 
import { FaMap } from 'react-icons/fa';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Header = ({ 
  toggleSidebar, 
  isSidebarOpen, 
  siteName, 
  userName,
  setSearchQuery,
  sortOption,
  setSortOption 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');

  const sortOptions = ['심박수 순', '즐겨찾기 순', '이름 순', '최근 등록순'];
  const isHomePage = location.pathname === '/';
  const isGridView = location.pathname === '/datagridview';

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setLocalSearch(value);
    setSearchQuery(value);
  }, [setSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, setSearchQuery]);

  const handleDataGridViewClick = () => {
    if (location.pathname === '/datagridview') {
      navigate('/');
    } else {
      navigate('/datagridview');
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-white shadow-md flex items-center justify-between px-4 z-50">
      {/* 왼쪽 섹션 */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:scale-110 transform transition-transform duration-200"
        >
          {isSidebarOpen ? (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>

        <Link to="/" className="flex items-center ml-2 hover:scale-105 transform transition-transform duration-200">
          <img src={`${process.env.PUBLIC_URL}/AiFitLogoBgRmv.png`} alt="Logo" className="h-12 w-12" />
          <span className="ml-2 text-[24px] font-semibold text-gray-800">
            AiFit Manager
          </span>
        </Link>

        {/* 환영 메시지를 왼쪽으로 이동 */}
        <div className="hidden lg:flex items-center ml-4 mt-1">
          <span className="text-[#797979] text-[18px]">{siteName}, {userName}님 환영합니다!</span>
        </div>
      </div>

      {/* 오른쪽 섹션 - 웹에서만 표시 */}
      <div className="flex items-center">
        {/* 정렬 옵션 - 웹에서만 표시 */}
        {isHomePage && (
          <div className="hidden lg:flex space-x-2">
            {sortOptions.map((option) => (
              <button
                key={option}
                className={`px-4 py-2 ${sortOption === option ? 'font-bold text-black' : 'text-gray-500'}`}
                onClick={() => setSortOption(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* 검색창 - 웹에서만 표시 */}
        {isHomePage && (
          <div className="hidden lg:block relative">
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="이름 검색"
              className="search-input border border-gray-300 rounded-full p-2 pr-8 pl-4"
              style={{ backgroundColor: '#f4f4f4', color: '#333', width: '200px' }}
            />
            {localSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                <AiOutlineClose className="text-lg" />
              </button>
            )}
          </div>
        )}

        {/* 기능 버튼들 - 웹에서만 표시 */}
        <div className="hidden lg:flex items-center space-x-2">
          <Link to="/floorplan">
            <motion.button
              className="bg-transparent hover:bg-gray-100 text-black p-2 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaMap className="text-2xl" />
            </motion.button>
          </Link>

          <motion.button
            onClick={handleDataGridViewClick}
            className="bg-transparent hover:bg-gray-100 text-black p-2 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {location.pathname === '/' ? (
              <CiBoxList className="text-2xl" />
            ) : (
              <VscGraph className="text-2xl" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
