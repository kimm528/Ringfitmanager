// Dashboard.js
import React, { useState, useMemo, useCallback } from 'react';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { calculateUserStatus } from './calculateUserStatus'; // 함수 임포트

const Dashboard = ({
  showModal,
  setShowModal,
  users,
  setUsers,
  searchQuery,
  handleAddUser,
  updateUser,
  deleteUser,
  availableRings,
  toggleFavorite,
}) => {
  const [newUser, setNewUser] = useState({
    name: '',
    gender: '',
    age: '',
    profileImage: null,
  });

  const [sortOption, setSortOption] = useState('이름 순');

  // Filter and Sort Users using useMemo for performance
  const sortedUsers = useMemo(() => {
    // 검색어로 필터링
    const filtered = users.filter((user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 각 사용자에 대해 위험 상태 계산
    const usersWithStatus = filtered.map((user) => ({
      ...user,
      status: calculateUserStatus(user),
    }));

    // 사용자 정렬
    usersWithStatus.sort((a, b) => {
      // 먼저 위험 상태로 정렬 ('danger' 상태만 상단으로)
      if (a.status === 'danger' && b.status !== 'danger') {
        return -1;
      } else if (a.status !== 'danger' && b.status === 'danger') {
        return 1;
      } else {
        // 위험 상태가 동일한 경우 선택한 정렬 옵션으로 정렬
        switch (sortOption) {
          case '심박수 순':
            return (b.data?.bpm || 0) - (a.data?.bpm || 0);
          case '즐겨찾기 순':
            return (b.isFavorite === true) - (a.isFavorite === true);
          case '이름 순':
          default:
            return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
    });

    return usersWithStatus;
  }, [users, searchQuery, sortOption]);

  // Handle User Addition
  const handleSubmit = useCallback(() => {
    if (!newUser.name || !newUser.gender || !newUser.age) {
      alert('모든 필드를 입력하세요.');
      return;
    }

    const userToAdd = {
      ...newUser,
      profileImage:
        newUser.profileImage || 'https://default-image-url.com/default.jpg', // 기본 프로필 이미지 처리
    };

    handleAddUser(userToAdd);
    setNewUser({ name: '', gender: '', age: '', profileImage: null });
    setShowModal(false);
  }, [newUser, handleAddUser, setShowModal]);

  return (
    <div>
      {/* Sorting Buttons */}
      <div className="flex justify-end mb-4">
        {['심박수 순', '즐겨찾기 순', '이름 순'].map((option) => (
          <button
            key={option}
            className={`px-4 py-2 ${
              sortOption === option ? 'font-bold' : 'text-gray-500'
            }`}
            onClick={() => setSortOption(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {/* User Cards */}
      <div
        className="dashboard-container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'flex-start',
        }}
      >
        <AnimatePresence>
          {sortedUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card
                user={user}
                toggleFavorite={toggleFavorite}
                updateUser={updateUser}
                deleteUser={deleteUser}
                availableRings={availableRings}
                users={users} // users 데이터를 전달
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add User Modal */}
{showModal && (
  <Modal onClose={() => setShowModal(false)}>
    <div className="bg-white p-8 rounded-lg shadow-lg w-[500px]">
      <h2 className="text-xl font-bold mb-4">새 사용자 추가</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block">이름</label>
          <input
            type="text"
            name="name"
            value={newUser.name}
            onChange={(e) =>
              setNewUser({ ...newUser, name: e.target.value })
            }
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="이름을 입력하세요"
          />
        </div>
        <div>
          <label className="block">성별</label>
          <select
            name="gender"
            value={newUser.gender}
            onChange={(e) =>
              setNewUser({ ...newUser, gender: e.target.value })
            }
            className="p-2 border border-gray-300 rounded w-full"
          >
            <option value="">성별을 선택하세요</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>
        </div>
        <div>
          <label className="block">나이</label>
          <input
            type="number"
            name="age"
            value={newUser.age}
            onChange={(e) =>
              setNewUser({ ...newUser, age: e.target.value })
            }
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="나이를 입력하세요"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          사용자 추가
        </button>
        <button
          onClick={() => setShowModal(false)}
          className="bg-gray-300 text-black py-2 px-4 rounded"
        >
          닫기
        </button>
      </div>
    </div>
  </Modal>
)}

    </div>
  );
};

export default Dashboard;
