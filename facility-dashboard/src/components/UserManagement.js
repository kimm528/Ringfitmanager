import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { HiOutlineSearch, HiOutlineUserAdd, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { motion } from 'framer-motion';

const UserManagement = ({
  users,
  setUsers,
  handleAddUser,
  updateUser,
  deleteUser,
  siteId,
  availableRings,
  showModal,
  setShowModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingField, setEditingField] = useState({ userId: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', gender: '', age: '' });

  // 검색어에 따른 필터링
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleEdit = (userId, field, value) => {
    setEditingField({ userId, field });
    setEditValue(value);
  };

  const handleSave = async (userId) => {
    const user = users.find(u => u.id === userId);
    const field = editingField.field;
    
    // 서버와 통신이 필요한 기본 정보 필드들
    const serverFields = ['name', 'gender', 'age', 'address'];
    
    try {
      if (serverFields.includes(field)) {
        // 서버에 업데이트가 필요한 필드인 경우
        const updatedUser = {
          ...user,
          [field]: field === 'gender' ? 
            (editValue === '남성' ? 0 : 1) : // 성별은 0 또는 1로 변환
            field === 'age' ? parseInt(editValue) : // 나이는 숫자로 변환
            editValue
        };
        
        // 서버 업데이트 호출
        await updateUser(updatedUser, true);
      } else {
        // 보호자 정보 등 로컬에서만 관리되는 필드
        const updatedUser = {
          ...user,
          [field]: editValue
        };
        
        // 로컬 상태만 업데이트
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? updatedUser : u
          )
        );
      }
      
      // 편집 모드 종료
      setEditingField({ userId: null, field: null });
      setEditValue('');
      
    } catch (error) {
      console.error('사용자 정보 수정 중 오류 발생:', error);
      alert('사용자 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const EditableField = ({ userId, field, value, label }) => {
    const isEditing = editingField.userId === userId && editingField.field === field;
    const isServerField = ['name', 'gender', 'age', 'address'].includes(field);
    
    return (
      <div className="mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        {isEditing ? (
          <div className="flex gap-2 mt-1">
            {field === 'gender' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            ) : (
              <input
                type={field === 'age' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSave(userId)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              저장
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditingField({ userId: null, field: null })}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              취소
            </motion.button>
          </div>
        ) : (
          <div
            onClick={() => handleEdit(userId, field, value)}
            className={`mt-1 px-3 py-1.5 rounded-lg cursor-pointer group transition-all duration-200 ${
              isServerField ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`${isServerField ? 'text-blue-600' : 'text-gray-700'}`}>
                {value || '미등록'}
              </span>
              <HiOutlinePencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 상단 검색 및 추가 버튼 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="사용자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          >
            <HiOutlineUserAdd className="w-5 h-5" />
            <span>사용자 추가</span>
          </motion.button>
        </div>
      </div>

      {/* 사용자 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <EditableField
                  userId={user.id}
                  field="name"
                  value={user.name}
                  label="이름"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteClick(user)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  userId={user.id}
                  field="gender"
                  value={user.gender === 0 ? '남성' : '여성'}
                  label="성별"
                />
                <EditableField
                  userId={user.id}
                  field="age"
                  value={user.age.toString()}
                  label="나이"
                />
              </div>
              <EditableField
                userId={user.id}
                field="address"
                value={user.address}
                label="주소"
              />
              <EditableField
                userId={user.id}
                field="phone"
                value={user.phone || `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`}
                label="휴대폰"
              />
              
              <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-900">보호자 정보</h3>
                </div>
                <div className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
                  <EditableField
                    userId={user.id}
                    field="guardianName"
                    value={user.guardianName || `${user.name}의 보호자`}
                    label="이름"
                  />
                  <EditableField
                    userId={user.id}
                    field="guardianPhone"
                    value={user.guardianPhone || `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`}
                    label="연락처"
                  />
                  <EditableField
                    userId={user.id}
                    field="guardianEmail"
                    value={user.guardianEmail || `guardian_${user.name.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`}
                    label="이메일"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 사용자 추가 모달 */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">새 사용자 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                <select
                  value={newUser.gender}
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">성별을 선택하세요</option>
                  <option value="0">남성</option>
                  <option value="1">여성</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                <input
                  type="number"
                  value={newUser.age}
                  onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="나이를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (!newUser.name || !newUser.gender || !newUser.age) {
                    alert('모든 필드를 입력해주세요.');
                    return;
                  }
                  try {
                    await handleAddUser(newUser);
                    setNewUser({ name: '', gender: '', age: '' });
                    setShowModal(false);
                  } catch (error) {
                    console.error('사용자 추가 중 오류 발생:', error);
                    alert('사용자 추가에 실패했습니다.');
                  }
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
              >
                추가
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </motion.button>
            </div>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <Modal onClose={() => setDeleteModalOpen(false)}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">사용자 삭제 확인</h3>
            <p className="text-gray-600 mb-6">
              정말 <span className="font-medium text-gray-900">{userToDelete?.name}</span> 사용자를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-sm"
              >
                삭제
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeleteModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </motion.button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
