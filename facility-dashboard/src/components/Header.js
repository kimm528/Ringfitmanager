import React, { useState, useEffect, useCallback } from 'react';
import { VscGraph } from "react-icons/vsc";  
import { CiBoxList } from "react-icons/ci";  
import { RiUserAddFill } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai"; 
import { FaMap } from 'react-icons/fa'; 
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion'; 

const Header = ({ setShowModal, setSearchQuery, sortOption, setSortOption }) => {
  const [localSearch, setLocalSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const sortOptions = ['심박수 순', '즐겨찾기 순', '이름 순', '최근 등록순'];

  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      setLocalSearch(value);
      setSearchQuery(value);
    },
    [setSearchQuery]
  );

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
      navigate('/'); // 홈 화면으로 이동
    } else {
      navigate('/datagridview'); // DataGridView로 이동
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  return (
    <header className="header flex items-center p-4 bg-white shadow-md border-b-2 border-gray-500 fixed top-0 z-50 right-0 w-full">
      {/* 왼쪽: 로고 */}
      <div className="flex items-center">
        <motion.div
          className="w-16 h-12 overflow-hidden flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <img
            src={`${process.env.PUBLIC_URL}/AiFitLogoBgRmv.png`}
            alt="Home Icon"
            className="w-18 h-18 object-contain"
          />
        </motion.div>
      </div>

      {/* 오른쪽 영역 */}
      <div className="flex items-center ml-auto space-x-4">
        {/* 정렬 옵션 버튼들 */}
        <div className="flex space-x-2">
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

        {/* 검색창 */}
        <div className="relative">
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="이름 검색"
            className="search-input border border-gray-300 rounded-full p-2 pr-8 pl-4"
            style={{ backgroundColor: '#f4f4f4', color: '#333', width: '200px' }}
            aria-label="이름 검색"
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 focus:outline-none"
              aria-label="검색어 지우기"
            >
              <AiOutlineClose className="text-lg" />
            </button>
          )}
        </div>

        {/* 센터 현황 버튼 (GridView 전환 버튼 왼쪽에 배치) */}
        <Link to="/floorplan">
          <motion.button
            className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
            aria-label="센터 현황 보기"
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            title="센터 현황"
          >
            <FaMap className="text-2xl mr-2" />
          </motion.button>
        </Link>

        {/* 화면 전환 버튼 (GridView <-> ListView) */}
        {location.pathname === '/' ? (
          <motion.button
            onClick={handleDataGridViewClick}
            className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
            aria-label="리스트 보기"
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            title="리스트 보기"
          >
            <CiBoxList className="text-2xl mr-2" />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleDataGridViewClick}
            className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
            aria-label="홈 화면 보기"
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            title="카드 보기"
          >
            <VscGraph className="text-2xl mr-2" />
          </motion.button>
        )}

        {/* 사용자 추가 버튼 */}
        <motion.button
          onClick={() => setShowModal(true)}
          className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
          aria-label="사용자 추가"
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          title="사용자 추가"
        >
          <RiUserAddFill className="text-2xl mr-2" /> 
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
