import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';

const AssignUsers = ({ users, updateUser, siteId }) => {
  const [adminList, setAdminList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState(Cookies.get('adminId'));
  const [selectedUsers, setSelectedUsers] = useState([]);

  // 관리자 목록 가져오기
  const fetchAdminList = async () => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(
        `https://api.ring.dotories.com/api/manager?id=${currentAdminId}&isLogin=false`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      let data = await response.json();

      // 응답 데이터가 문자열인 경우 다시 파싱
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (response.ok) {
        setAdminList(data.Data);
        // 현재 관리자의 할당된 사용자 목록 설정
        if (data.Data.AdminId === currentAdminId) {
          setSelectedUsers(data.Data.AssignUsers || []);
        }
      }
    } catch (error) {
      console.error('관리자 목록 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminList();
  }, [siteId]);

  const handleUserToggle = async (userId) => {
    try {
      const newSelectedUsers = selectedUsers.includes(userId)
        ? selectedUsers.filter(id => id !== userId)
        : [...selectedUsers, userId];

      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`https://api.ring.dotories.com/api/manager`, {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: '',
            sitePassword: ''
          },
          data: {
          SiteId: adminList.SiteId,
          AdminId: adminList.AdminId,
          Password: adminList.Password,
          Name: adminList.Name,
          Description: adminList.Description,
          AssignUsers: newSelectedUsers,
          },
        })
      });

      if (response.ok) {
        setSelectedUsers(newSelectedUsers);
        fetchAdminList(); // 목록 새로고침
      }
    } catch (error) {
      console.error('사용자 할당 업데이트 오류:', error);
    }
  };

  // 전체 할당 처리 함수 추가
  const handleAssignAll = async () => {
    try {
      const unassignedUsers = users.filter(user => !selectedUsers.includes(user.id));
      const newSelectedUsers = [...selectedUsers, ...unassignedUsers.map(user => user.id)];

      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch('https://api.ring.dotories.com/api/manager', {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: '',
            sitePassword: ''
          },
          data: {
            SiteId: adminList.SiteId,
            AdminId: adminList.AdminId,
            Password: adminList.Password,
            Name: adminList.Name,
            Description: adminList.Description,
            AssignUsers: newSelectedUsers,
          },
        })
      });

      if (response.ok) {
        setSelectedUsers(newSelectedUsers);
        fetchAdminList();
      }
    } catch (error) {
      console.error('전체 할당 중 오류 발생:', error);
    }
  };

  // 전체 해제 처리 함수 추가
  const handleUnassignAll = async () => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch('https://api.ring.dotories.com/api/manager', {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: '',
            sitePassword: ''
          },
          data: {
            SiteId: adminList.SiteId,
            AdminId: adminList.AdminId,
            Password: adminList.Password,
            Name: adminList.Name,
            Description: adminList.Description,
            AssignUsers: [],
          },
        })
      });

      if (response.ok) {
        setSelectedUsers([]);
        fetchAdminList();
      }
    } catch (error) {
      console.error('전체 해제 중 오류 발생:', error);
    }
  };

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 gap-6">
        {/* 할당된 사용자 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">할당된 사용자</h2>
                <p className="mt-1 text-sm text-gray-500">현재 관리 중인 사용자 목록입니다.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnassignAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                전체 해제
              </motion.button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">나이</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(user => selectedUsers.includes(user.id)).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.gender === 0 ? '남성' : '여성'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.age}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUserToggle(user.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        할당 해제
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 미할당 사용자 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">미할당 사용자</h2>
                <p className="mt-1 text-sm text-gray-500">할당 가능한 사용자 목록입니다.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAssignAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                전체 할당
              </motion.button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">나이</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(user => !selectedUsers.includes(user.id)).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.gender === 0 ? '남성' : '여성'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.age}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUserToggle(user.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        할당하기
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUsers;
