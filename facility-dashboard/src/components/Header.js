import React, { useState, useEffect, useCallback } from 'react';
import fitLogo from '../assets/Fitmon_logo.svg';
import { VscGraph } from "react-icons/vsc";  // VscGraph 아이콘 임포트
import { CiBoxList } from "react-icons/ci";  // CiBoxList 아이콘 임포트
import { RiUserAddFill } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai"; // 닫기 아이콘 임포트
import { useNavigate, useLocation } from 'react-router-dom'; // useNavigate 훅
import { motion } from 'framer-motion'; // framer-motion 임포트

const Header = ({ setShowModal, setSearchQuery }) => {
  const [localSearch, setLocalSearch] = useState('');
  const navigate = useNavigate(); // useNavigate 훅
  const location = useLocation(); // useLocation 훅

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

  // DataGridView 버튼 클릭 시 토글 애니메이션
  const handleDataGridViewClick = () => {
    if (location.pathname === '/datagridview') {
      navigate('/'); // 홈 화면으로 이동
    } else {
      navigate('/datagridview'); // DataGridView로 이동
    }
  };

  // 검색 입력 초기화 함수
  const clearSearch = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  return (
    <header className="header flex justify-between items-center p-4 bg-white shadow-md fixed top-0 z-50 right-0 w-full">
      <div className="flex items-center">
        {/* 로고 이미지 */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <img src={fitLogo} alt="Home Icon" className="w-12 h-12 mr-4 cursor-pointer" onClick={() => navigate('/')} />
        </motion.div>
      </div>
      <div className="flex items-center">
        {/* 검색 입력창과 닫기 아이콘을 감싸는 컨테이너 */}
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

        {/* 화면에 맞는 버튼만 표시 */}
        {location.pathname === '/' ? (
          // 홈 화면일 때는 리스트 보기 버튼만 표시
          <motion.button
            onClick={handleDataGridViewClick}
            className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
            aria-label="리스트 보기"
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            title="리스트 보기" // 툴팁 추가
          >
            <CiBoxList className="text-2xl mr-2" />
          </motion.button>
        ) : (
          // 그리드 화면일 때는 홈 화면 보기 버튼만 표시
          <motion.button
            onClick={handleDataGridViewClick}
            className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center"
            aria-label="홈 화면 보기"
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            title="카드 보기" // 툴팁 추가
          >
            <VscGraph className="text-2xl mr-2" />
          </motion.button>
        )}

        {/* 사용자 추가 버튼 */}
        <motion.button
          onClick={() => setShowModal(true)}
          className="bg-transparent hover:bg-gray text-black p-2 rounded-lg flex items-center ml-3"
          aria-label="사용자 추가"
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          title="사용자 추가" // 툴팁 추가
        >
          <RiUserAddFill className="text-2xl mr-2" /> 
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
