// src/components/Header.js

import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import fitLogo from '../assets/Fitmon_logo.svg';
import { Link } from 'react-router-dom'; // Link 컴포넌트 임포트
import { motion } from 'framer-motion'; // framer-motion 임포트

const Header = ({ setShowModal, setSearchQuery }) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      setLocalSearch(value);
      setSearchQuery(value);
    },
    [setSearchQuery]
  );
  // 검색 입력 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, setSearchQuery]);

  return (
    <header className="header flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center">
        {/* 로고 이미지 */}
        <Link to="/">
          <img src={fitLogo} alt="Home Icon" className="w-12 h-12 mr-4" />
        </Link>
      </div>
      <div className="flex items-center">
        {/* 검색 입력창 */}
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="이름 검색"
          className="search-input border border-gray-300 rounded-full p-2 mr-4"
          style={{ backgroundColor: '#f4f4f4', color: '#333', width: '200px' }}
          aria-label="이름 검색"
        />
        {/* 사용자 추가 버튼 with framer-motion */}
        <motion.button
          onClick={() => setShowModal(true)}
          className="add-user-btn bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg flex items-center"
          aria-label="사용자 추가"
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <FaPlus className="mr-2" /> 사용자 추가
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
