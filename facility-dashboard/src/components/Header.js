import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const Header = ({ setShowModal, setSearchQuery }) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setLocalSearch(value);
    setSearchQuery(value); // Send search query to the parent (App.js)
  };

  return (
    <header className="header flex justify-between items-center p-2 bg-white shadow-md">
      <h1 className="text-xl font-bold text-black">Home</h1>
      <div className="flex items-center justify-end w-full">
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="이름 검색"
          className="search-input border border-gray-300 rounded-full p-2 mr-4"
          style={{ backgroundColor: '#f4f4f4', color: '#c4c4c4', width: '200px' }}
        />
        <button
          onClick={() => setShowModal(true)}
          className="add-user-btn bg-blue-500 text-white p-2 rounded-lg flex items-center"
        >
          <FaPlus className="mr-2" /> 사용자 추가
        </button>
      </div>
    </header>
  );
};

export default Header;
