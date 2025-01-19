// src/components/Settings.js

import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

const ModalComponent = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl relative max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

//const url = 'http://14.47.20.111:7201';
const url = 'https://api.ring.dotories.com';

const Settings = ({
  adminInfo,
  handleUpdateAdminInfo,
  users,
  deleteUser,
  siteId,
  disconnectInterval,
  setDisconnectInterval,
}) => {
  // 관리자 관리 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [sitePassword, setSitePassword] = useState(''); // 사이트 비밀번호 상태 추가
  const [adminList, setAdminList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // 탭 상태 추가
  const [activeTab, setActiveTab] = useState('admin'); // 기본값은 'admin' 탭

  // disconnectInterval 상태 추가
  const [newDisconnectInterval, setNewDisconnectInterval] = useState(disconnectInterval);

  // 관리자 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    adminId: '',
    name: '',
    password: '',
  });

  // 관리자 명단을 서버로부터 가져오는 함수
  const fetchAdminList = async (updatedSitePassword) => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(
        `${url}/api/manager/list?siteId=${siteId}&sitePassword=${updatedSitePassword}`,
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
  
      if (response.ok && data.Header && Array.isArray(data.Data)) {
        setAdminList(data.Data); // 서버에서 반환한 관리자 리스트 설정
      } else {
        console.error('관리자 명단을 가져오는데 실패했습니다:', data);
        const errorMsg = data.ErrorMessage || '관리자 명단을 가져오는데 실패했습니다.';
        setErrorMessage(errorMsg);
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
      const response = await fetch(`${url}/api/site?siteId=${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        let data = await response.json();
  
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (parsingError) {
            console.error('JSON 파싱 오류:', parsingError);
            setErrorMessage('서버 응답을 처리할 수 없습니다.');
            return;
          }
        }
  
        // data.Data가 객체인지 확인
        if (data.Data && typeof data.Data === 'object') {
          // SiteId와 SitePassword 비교
          if (data.Data.SiteId === loginId && data.Data.SitePassword === loginPassword) {
            setIsAuthenticated(true);
            setErrorMessage('');
            setSitePassword(data.Data.SitePassword); // 로그인 성공 시 sitePassword 저장
  
            // setSitePassword로 상태 업데이트 후, 바로 값 사용
            fetchAdminList(data.Data.SitePassword); // 관리자 리스트 가져오기
          } else {
            setErrorMessage('아이디나 비밀번호가 올바르지 않습니다.');
          }
        } else {
          setErrorMessage('서버 응답 형식이 올바르지 않습니다.');
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
      const response = await fetch(`${url}/api/manager?siteId=${siteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: siteId, // 동적 siteId 추가
            sitePassword: sitePassword, // sitePassword 포함
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

      if (response.ok) {
        // 관리자 리스트 다시 가져오기
        fetchAdminList(sitePassword);
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

  // disconnectInterval 업데이트 함수
  const handleUpdateDisconnectInterval = async (e) => {
    e.preventDefault();

    if (!siteId) {
      alert('사이트 ID가 설정되지 않았습니다.');
      return;
    }

    if (!sitePassword) {
      alert('사이트 비밀번호가 설정되지 않았습니다.');
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`${url}/api/site?siteId=${siteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: siteId,
            sitePassword: sitePassword, // sitePassword 포함
          },
          data: {
            disconnectInterval: newDisconnectInterval,
            siteId: siteId,
            sitePassword: sitePassword,
          },
        }),
      });

      let data = await response.json();

      // 응답 데이터가 문자열인 경우 다시 파싱
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (response.ok) {
        alert('연결 시간 간격이 성공적으로 업데이트되었습니다.');
        setDisconnectInterval(newDisconnectInterval); // 애플리케이션 상태 업데이트
      } else {
        console.error('disconnectInterval 업데이트 실패:', data);
        alert('연결 시간 간격 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('disconnectInterval 업데이트 오류:', error);
      alert('연결 시간 간격 업데이트 중 오류가 발생했습니다.');
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
      const response = await fetch(`https://api.ring.dotories.com/api/manager`, {
        method: 'UPDATE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: siteId,
            sitePassword: sitePassword,
          },
          data: {
            AdminId: selectedAdmin.AdminId,
            Name: newAdminName,
            Password: newAdminPassword,
            SiteId: siteId,
            sitePassword: sitePassword,
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
    setNewAdminName(admin.AdminName || '');
    setNewAdminPassword('');
    setShowEditModal(true);
  };

  // 관리자 추가 함수
  const handleAddAdmin = async (e) => {
    e.preventDefault();

    if (!newAdmin.adminId || !newAdmin.name || !newAdmin.password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await fetch(`${url}/api/manager`, {
        method: 'INSERT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          header: {
            siteId: siteId,
            sitePassword: sitePassword,
          },
          data: {
            AdminId: newAdmin.adminId,
            Password: newAdmin.password,
            siteId: siteId,
            Name: newAdmin.name,
          },
        }),
      });

      let data = await response.json();
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (response.ok) {
        alert('관리자가 성공적으로 추가되었습니다.');
        setShowAddModal(false);
        setNewAdmin({ adminId: '', name: '', password: '' });
        fetchAdminList(sitePassword);
      } else {
        console.error('관리자 추가 실패:', data);
        alert('관리자 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('관리자 추가 오류:', error);
      alert('관리자 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">설정</h1>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              관리자 설정
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              연결 설정
            </div>
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'admin' && (
            <div>
              {!isAuthenticated ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">관리자 로그인</h2>
                  <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                      <input
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="관리자 아이디를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="비밀번호를 입력하세요"
                      />
                    </div>
                    {errorMessage && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {errorMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      로그인
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">관리자 목록</h2>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      관리자 추가
                    </button>
                  </div>
                  <div className="space-y-4">
                    {adminList.map((admin) => (
                      <div
                        key={admin.AdminId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{admin.AdminId}</p>
                          <p className="text-sm text-gray-500">{admin.AdminName}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.AdminId)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">연결 설정</h2>
              {isAuthenticated ? (
                <form onSubmit={handleUpdateDisconnectInterval} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연결 해제 시간 (초)
                    </label>
                    <input
                      type="number"
                      value={newDisconnectInterval}
                      onChange={(e) => setNewDisconnectInterval(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    저장
                  </button>
                </form>
              ) : (
                <p className="text-gray-500">설정을 변경하려면 먼저 로그인해 주세요.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 관리자 추가 모달 */}
      {showAddModal && (
        <ModalComponent onClose={() => setShowAddModal(false)}>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">새 관리자 추가</h3>
            <form onSubmit={handleAddAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 아이디
                </label>
                <input
                  type="text"
                  value={newAdmin.adminId}
                  onChange={(e) => setNewAdmin({ ...newAdmin, adminId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="관리자 아이디 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 이름
                </label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="관리자 이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="비밀번호 입력"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </ModalComponent>
      )}

      {showEditModal && (
        <ModalComponent onClose={() => setShowEditModal(false)}>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">관리자 정보 수정</h3>
            <form onSubmit={handleEditAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 이름
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="새 관리자 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="새 비밀번호"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </ModalComponent>
      )}
    </div>
  );
};

export default Settings;
