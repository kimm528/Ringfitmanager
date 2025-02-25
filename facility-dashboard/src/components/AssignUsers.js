import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AssignUsers = ({ users, adminList, assignedUsers, updateManagerAssignedUsers }) => {
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [unassignedSearchTerm, setUnassignedSearchTerm] = useState('');

  useEffect(() => {
    if (assignedUsers) {
      setSelectedUsers(assignedUsers);
      setLoading(false);
    }
  }, [assignedUsers]);

  const handleUserToggle = async (userId) => {
    try {
      const newSelectedUsers = selectedUsers.includes(userId)
        ? selectedUsers.filter(id => id !== userId)
        : [...selectedUsers, userId];

      await updateManagerAssignedUsers(newSelectedUsers);
    } catch (error) {
      console.error('사용자 할당 업데이트 오류:', error);
    }
  };

  // 전체 할당 처리 함수
  const handleAssignAll = async () => {
    try {
      const unassignedUsers = users.filter(user => !selectedUsers.includes(user.id));
      const newSelectedUsers = [...selectedUsers, ...unassignedUsers.map(user => user.id)];
      await updateManagerAssignedUsers(newSelectedUsers);
    } catch (error) {
      console.error('전체 할당 중 오류 발생:', error);
    }
  };

  // 전체 해제 처리 함수
  const handleUnassignAll = async () => {
    try {
      await updateManagerAssignedUsers([]);
    } catch (error) {
      console.error('전체 해제 중 오류 발생:', error);
    }
  };

  const filteredAssignedUsers = users
    .filter(user => selectedUsers.includes(user.id))
    .filter(user => 
      user.name.toLowerCase().includes(assignedSearchTerm.toLowerCase())
    );

  const filteredUnassignedUsers = users
    .filter(user => !selectedUsers.includes(user.id))
    .filter(user => 
      user.name.toLowerCase().includes(unassignedSearchTerm.toLowerCase())
    );

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* 할당된 사용자 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">할당된 사용자</h2>
                <p className="mt-1 text-sm text-gray-500">현재 관리 중인 사용자 목록입니다.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnassignAll}
                className="w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                전체 해제
              </motion.button>
            </div>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={assignedSearchTerm}
              onChange={(e) => setAssignedSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="grid gap-2 p-4">
              {filteredAssignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.gender === 0 ? '남성' : '여성'}</div>
                    <div className="text-sm text-gray-500">{user.age}세</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserToggle(user.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    할당 해제
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 미할당 사용자 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">미할당 사용자</h2>
                <p className="mt-1 text-sm text-gray-500">할당 가능한 사용자 목록입니다.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAssignAll}
                className="w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                전체 할당
              </motion.button>
            </div>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={unassignedSearchTerm}
              onChange={(e) => setUnassignedSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="grid gap-2 p-4">
              {filteredUnassignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between bg-white hover:bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.gender === 0 ? '남성' : '여성'}</div>
                    <div className="text-sm text-gray-500">{user.age}세</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserToggle(user.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    할당하기
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUsers;
