import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  setShowModal,
  setIsEditing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingField, setEditingField] = useState({ userId: null, field: null });
  const [editValue, setEditValue] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', gender: '', age: '' });

  // 편집 상태 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    setIsEditing(editingField.userId !== null);
  }, [editingField, setIsEditing]);

  // 검색어에 따른 필터링
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleEdit = (userId, field, value) => {
    setEditingField({ userId, field });
    const user = users.find(u => u.id === userId);
    if (user) {
      let initialValue = value;
      if (field === 'gender') {
        initialValue = user.gender === 0 ? '남성' : '여성';
      } else if (field === 'age') {
        initialValue = user.age.toString();
      } else if (field === 'phone') {
        initialValue = user.PhoneNumber || '';
      } else if (field === 'guardianName') {
        initialValue = user.GuardianName || '';
      } else if (field === 'guardianPhone') {
        initialValue = user.GuardianPhoneNumber || '';
      } else if (field === 'guardianEmail') {
        initialValue = user.GuardianEmail || '';
      }
      setEditValue(initialValue);
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

   const EditableField = React.memo(({ userId, field, value, label }) => {
    const isEditing = editingField.userId === userId && editingField.field === field;
    const isServerField = ['name', 'gender', 'age', 'address', 'phone', 'guardianName', 'guardianPhone', 'guardianEmail'].includes(field);
    const [localValue, setLocalValue] = useState(value);
    const isAgeField = field === 'age';

    useEffect(() => {
      if (isEditing) {
        setLocalValue(value);
      }
    }, [isEditing, value]);

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
    };

    const handleSaveClick = async () => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      try {
        const updatedUser = {
          id: userId,
          name: field === 'name' ? localValue : user.name,
          gender: field === 'gender' ? (localValue === '남성' ? 0 : 1) : user.gender,
          age: field === 'age' ? parseInt(localValue) : user.age,
          address: field === 'address' ? localValue : user.address,
          phoneNumber: field === 'phone' ? localValue : user.phoneNumber,
          guardianName: field === 'guardianName' ? localValue : user.guardianName,
          guardianPhoneNumber: field === 'guardianPhone' ? localValue : user.guardianPhoneNumber,
          guardianEmail: field === 'guardianEmail' ? localValue : user.guardianEmail,
          macAddr: user.macAddr || '',
          ringSettingDateTime: user.ringSettingDateTime || '',
          stepTarget: user.stepTarget || 10000,
          kcalTarget: user.kcalTarget || 2000,
          kmTarget: user.kmTarget || 5,
          lifeLogs: user.lifeLogs || [],
          warningHeartRate: user.warningHeartRate || [82, 120],
          dangersHeartRate: user.dangersHeartRate || [74, 140],
          favorite: user.favorite || false,
          createDateTime: user.createDateTime || ''
        };

        await updateUser(updatedUser, true);
        setEditingField({ userId: null, field: null });
      } catch (error) {
        console.error('사용자 정보 수정 중 오류 발생:', error);
        alert('사용자 정보 수정에 실패했습니다.');
      }
    };

    const handleCancelClick = () => {
      setLocalValue(value);
      setEditingField({ userId: null, field: null });
    };

    return (
      <div className="mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        {isEditing ? (
          <div className={`flex mt-1 ${isAgeField ? 'relative' : ''}`}>
            {field === 'gender' ? (
              <select
                value={localValue}
                onChange={handleInputChange}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            ) : (
              <div className={`flex-1 relative ${isAgeField ? 'w-24' : ''}`}>
                <input
                  type={field === 'age' ? 'number' : 'text'}
                  value={localValue}
                  onChange={handleInputChange}
                  className={`${isAgeField ? 'w-16' : 'w-full'} border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  autoFocus
                />
              </div>
            )}
            <div className={`flex gap-1 shrink-0 ${isAgeField ? 'absolute right-0 top-0' : 'ml-2'}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveClick}
                className="px-2 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                저장
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelClick}
                className="px-2 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                취소
              </motion.button>
            </div>
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
  });

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
                value={user.phoneNumber}
                label="휴대폰"
              />
              
              <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-4 px-4">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-gray-900">보호자 정보</h3>
                </div>
                <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100">
                  <EditableField
                    userId={user.id}
                    field="guardianName"
                    value={user.guardianName}
                    label="이름"
                  />
                  <EditableField
                    userId={user.id}
                    field="guardianPhone"
                    value={user.guardianPhoneNumber}
                    label="연락처"
                  />
                  <EditableField
                    userId={user.id}
                    field="guardianEmail"
                    value={user.guardianEmail}
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
