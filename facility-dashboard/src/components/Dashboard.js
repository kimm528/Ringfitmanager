import React, { useState } from 'react';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ showModal, setShowModal, users, setUsers, searchQuery, handleAddUser }) => {
  const [newUser, setNewUser] = useState({
    name: '',
    gender: '',
    age: '',
    profileImage: null,
  });

  const [sortOption, setSortOption] = useState('이름 순'); // 기본 정렬 옵션

  // 즐겨찾기 상태를 토글하는 함수
  const toggleFavorite = (userId) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isFavorite: !user.isFavorite } : user
      )
    );
  };

  // 사용자를 필터링 (검색)
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 정렬 함수
  const getSortedUsers = () => {
    let sortedUsers = [...filteredUsers];
    if (sortOption === '운동 점수 순') {
      sortedUsers.sort((a, b) => b.data.steps - a.data.steps); // 운동 점수 순으로 정렬
    } else if (sortOption === '심박수 순') {
      sortedUsers.sort((a, b) => b.data.bpm - a.data.bpm); // 심박수 순으로 정렬
    } else if (sortOption === '즐겨찾기 순') {
      sortedUsers.sort((a, b) => b.isFavorite - a.isFavorite); // 즐겨찾기 순 정렬
    } else if (sortOption === '이름 순') {
      sortedUsers.sort((a, b) => a.name.localeCompare(b.name, 'ko')); // 이름 가나다 순으로 정렬
    }
    return sortedUsers;
  };

  // 사용자 추가 처리 함수
  const handleSubmit = () => {
    handleAddUser(newUser);
    setNewUser({ name: '', gender: '', age: '', profileImage: null });
  };

  return (
    <div>
      {/* 상단 정렬 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          className={`px-4 py-2 ${sortOption === '운동 점수 순' ? 'font-bold' : 'text-gray-500'}`}
          onClick={() => setSortOption('운동 점수 순')}
        >
          운동 점수 순
        </button>
        <button
          className={`px-4 py-2 ${sortOption === '심박수 순' ? 'font-bold' : 'text-gray-500'}`}
          onClick={() => setSortOption('심박수 순')}
        >
          심박수 순
        </button>
        <button
          className={`px-4 py-2 ${sortOption === '즐겨찾기 순' ? 'font-bold' : 'text-gray-500'}`}
          onClick={() => setSortOption('즐겨찾기 순')}
        >
          즐겨찾기 순
        </button>
        <button
          className={`px-4 py-2 ${sortOption === '이름 순' ? 'font-bold' : 'text-gray-500'}`}
          onClick={() => setSortOption('이름 순')}
        >
          이름 순
        </button>
      </div>

      {/* 카드 표시 */}
      <div className="dashboard-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
        <AnimatePresence>
          {getSortedUsers().map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card key={user.id} user={user} toggleFavorite={toggleFavorite} /> {/* 즐겨찾기 토글 추가 */}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 사용자 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[500px]" style={{ zIndex: 1100 }}>
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
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button onClick={handleSubmit} className="bg-blue-500 text-white py-2 px-4 rounded">
                사용자 추가
              </button>
              <button onClick={() => setShowModal(false)} className="bg-gray-300 text-black py-2 px-4 rounded">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
