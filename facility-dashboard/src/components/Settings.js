// src/components/Settings.js

import React, { useState } from 'react';

// 간단한 Modal 컴포넌트 구현
const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const Settings = ({ adminInfo, handleUpdateAdminInfo, users, deleteUser, siteId }) => {
  // 관리자 관리 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminList, setAdminList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // 관리자 명단을 서버로부터 가져오는 함수
  const fetchAdminList = async () => {
    if (!siteId) {
      console.error('siteId가 설정되지 않았습니다.');
      setErrorMessage('사이트 ID가 설정되지 않았습니다.');
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`https://fitlife.dotories.com/api/manager?siteId=${siteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
      });

      let data = await response.json();

      // 응답 데이터가 문자열인 경우 다시 파싱
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (response.ok && data.Header && data.Header.Command === 3 && Array.isArray(data.Data)) {
        setAdminList(data.Data); // 서버에서 반환한 관리자 리스트 설정
      } else {
        console.error('관리자 명단을 가져오는데 실패했습니다:', data);
        setErrorMessage('관리자 명단을 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('관리자 명단 가져오기 오류:', error);
      setErrorMessage('관리자 명단을 가져오는 중 오류가 발생했습니다.');
    }
  };

  // 관리자 로그인 함수
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!loginId || !loginPassword) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (!siteId) {
      setErrorMessage('사이트 ID가 설정되지 않았습니다.');
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      // siteId prop을 사용하여 요청 URL 수정
      const response = await fetch(`https://fitlife.dotories.com/api/site?siteId=${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        let data = await response.json();

        // 응답 데이터가 문자열인 경우 다시 파싱
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        console.log('로그인 응답 데이터:', data);

        // 데이터 구조에 따라 접근 방식 수정
        if (data.data.siteId === loginId && data.data.sitePassword === loginPassword) {
          setIsAuthenticated(true);
          setErrorMessage('');
          fetchAdminList(); // 로그인 성공 시 관리자 리스트 가져오기
        } else {
          setErrorMessage('아이디나 비밀번호가 올바르지 않습니다.');
        }
      } else {
        let data = await response.json();
        console.error('로그인 실패:', data);
        setErrorMessage('아이디가 존재하지 않거나 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    }
  };

  // 관리자 삭제 함수
  const handleDeleteAdmin = async (adminId) => {
    if (!siteId) {
      alert('사이트 ID가 설정되지 않았습니다.');
      return;
    }

    if (!window.confirm(`정말로 ${adminId} 관리자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`https://fitlife.dotories.com/api/manager?siteId=${siteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            command: 9, // 관리자 삭제를 위한 명령 코드
            siteId: siteId, // 동적 siteId 추가
          },
          data: {
            AdminId: adminId,
          },
        }),
      });

      let data = await response.json();

      // 응답 데이터가 문자열인 경우 다시 파싱
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (response.ok && data.Header && data.Header.Command === 9) {
        // 관리자 리스트 다시 가져오기
        fetchAdminList();
        alert('관리자가 성공적으로 삭제되었습니다.');
      } else {
        console.error('관리자 삭제 실패:', data);
        alert('관리자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('관리자 삭제 오류:', error);
      alert('관리자 삭제 중 오류가 발생했습니다.');
    }
  };

  // 관리자 수정 함수
  const handleEditAdmin = async (e) => {
    e.preventDefault();

    if (!newAdminName || !newAdminPassword) {
      alert('이름과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`https://fitlife.dotories.com/api/manager`, {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            command: 7, // 관리자 수정을 위한 명령 코드
            SiteId: siteId, // 동적 siteId 추가
          },
          data: {
            AdminId: selectedAdmin.AdminId,
            Name: newAdminName,
            Password: newAdminPassword,
            SiteId: siteId,
          },
        }),
      });

      let data = await response.json();

      // 응답 데이터가 문자열인 경우 다시 파싱
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
    if (response.ok) { // 조건 수정: response.ok만 확인
      alert('관리자 정보가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      setSelectedAdmin(null);
      setNewAdminName('');
      setNewAdminPassword('');
      fetchAdminList(); // 관리자 리스트 다시 가져오기
    } else {
      console.error('관리자 수정 실패:', data);
      alert('관리자 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('관리자 수정 오류:', error);
    alert('관리자 수정 중 오류가 발생했습니다.');
  }
};

  // 수정 버튼 클릭 시 호출되는 함수
  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setNewAdminName(admin.Name);
    setNewAdminPassword(''); // 보안을 위해 비밀번호는 빈칸으로 초기화
    setShowEditModal(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {/* 관리 페이지 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">관리 페이지</h2>

        {!isAuthenticated ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">관리자 아이디</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">비밀번호</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            {errorMessage && (
              <div className="text-red-500 text-sm">
                {errorMessage}
              </div>
            )}
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                로그인
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">관리자 명단</h3>
              {/* 관리자 추가 버튼 (필요 시 추가) */}
            </div>
            {adminList.length === 0 ? (
              <p>등록된 관리자가 없습니다.</p>
            ) : (
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">관리자 아이디</th>
                    <th className="py-2 px-4 border-b">이름</th>
                    <th className="py-2 px-4 border-b">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map((admin) => (
                    <tr key={admin.AdminId} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">{admin.AdminId}</td>
                      <td className="py-2 px-4 border-b">{admin.Name}</td>
                      <td className="py-2 px-4 border-b flex space-x-2">
                        {/* 수정 버튼 추가 */}
                        <button
                          onClick={() => openEditModal(admin)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        >
                          수정
                        </button>
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleDeleteAdmin(admin.AdminId)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 관리자 수정 모달 */}
            {showEditModal && selectedAdmin && (
              <Modal onClose={() => setShowEditModal(false)}>
                <h2 className="text-xl font-semibold mb-4">관리자 정보 수정</h2>
                <form onSubmit={handleEditAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">관리자 이름</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      required
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      required
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      수정 완료
                    </button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
