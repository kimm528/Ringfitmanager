// src/components/Dashboard.js
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';

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
  assignRingToUser,
  fetchUsers, // App.js에서 전달한 fetchUsers 함수
  fetchRingData, // App.js에서 전달한 fetchRingData 함수
}) => {
  const [newUser, setNewUser] = useState({
    name: '',
    gender: '',
    age: '',
    profileImage: null,
  });

  const [sortOption, setSortOption] = useState('이름 순');

  // Toggle Favorite Status
  const toggleFavorite = useCallback((userId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isFavorite: !user.isFavorite } : user
      )
    );
  }, [setUsers]);

  // Filter and Sort Users using useMemo for performance
  const sortedUsers = useMemo(() => {
    let filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortOption) {
      case '운동 점수 순':
        filtered.sort((a, b) => {
          const aGoal = a.goals?.stepsGoal || 1;
          const bGoal = b.goals?.stepsGoal || 1;
          const aAchievement = (a.data?.steps || 0) / aGoal;
          const bAchievement = (b.data?.steps || 0) / bGoal;
          return bAchievement - aAchievement;
        });
        break;
      case '심박수 순':
        filtered.sort((a, b) => (b.data?.bpm || 0) - (a.data?.bpm || 0));
        break;
      case '즐겨찾기 순':
        filtered.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
        break;
      case '이름 순':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    return filtered;
  }, [users, searchQuery, sortOption]);

  // Handle User Addition
  const handleSubmit = useCallback(() => {
    if (!newUser.name || !newUser.gender || !newUser.age) {
      alert('모든 필드를 입력하세요.');
      return;
    }
    handleAddUser(newUser);
    setNewUser({ name: '', gender: '', age: '', profileImage: null });
  }, [newUser, handleAddUser]);

  // 데이터 페칭 및 주기적 업데이트
  useEffect(() => {
    // 컴포넌트 마운트 시 데이터 페칭
    fetchUsers();
    fetchRingData();

    // 30초 간격으로 데이터 페칭
    const intervalId = setInterval(() => {
      console.log('Fetching users and ring data every 30 seconds');
      fetchUsers();
      fetchRingData();
    }, 30000); // 30초

    // 컴포넌트 언마운트 시 interval 정리
    return () => clearInterval(intervalId);
  }, [fetchUsers, fetchRingData]);

  return (
    <div>
      {/* Sorting Buttons */}
      <div className="flex justify-end mb-4">
        {['운동 점수 순', '심박수 순', '즐겨찾기 순', '이름 순'].map((option) => (
          <button
            key={option}
            className={`px-4 py-2 ${sortOption === option ? 'font-bold' : 'text-gray-500'}`}
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
                assignRingToUser={assignRingToUser}
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
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="p-2 border border-gray-300 rounded w-full"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block">성별</label>
                <select
                  name="gender"
                  value={newUser.gender}
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
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
                  onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                  className="p-2 border border-gray-300 rounded w-full"
                  placeholder="나이를 입력하세요"
                />
              </div>
              <div>
                <label className="block">프로필 사진</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      profileImage: URL.createObjectURL(e.target.files[0]),
                    })
                  }
                  className="p-2 border border-gray-300 rounded w-full"
                />
                {newUser.profileImage && (
                  <img
                    src={newUser.profileImage}
                    alt="프로필 미리보기"
                    className="mt-2 w-24 h-24 rounded-full object-cover"
                  />
                )}
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
