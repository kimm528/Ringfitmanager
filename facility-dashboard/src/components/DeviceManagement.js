// src/components/DeviceManagement.js

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FaRing } from 'react-icons/fa';
import Header from './Header.js';
import Modal from './Modal.js';
import { useLocation } from 'react-router-dom';

const DeviceManagement = ({ 
  users, 
  setUsers, 
  siteId, 
  fetchUsers, 
  setActiveComponent, 
  devices, 
  availableRings,
  toggleSidebar,
  isSidebarOpen,
  userName,
  adminList,
  assignedUsers
}) => {
  const location = useLocation();
  const initialSearchTerm = location.state?.searchTerm || '';
  const initialSelectedUser = location.state?.selectedUser || null;
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedUser, setSelectedUser] = useState(initialSelectedUser);
  const [userSearchTerm, setUserSearchTerm] = useState(initialSearchTerm);

  const [connectableDevices, setConnectableDevices] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [editingDeviceMacAddr, setEditingDeviceMacAddr] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [connectableSearchTerm, setConnectableSearchTerm] = useState('');
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalAction, setModalAction] = useState('assign');
  

  const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
  //const url = 'https://api.ring.dotories.com';
  //const url = 'http://14.47.20.111:7201'
  const url = 'https://dotoriesringcloudserver-b2bgarb8bth5b9ff.koreacentral-01.azurewebsites.net';


  const userListRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  // 날짜를 'yyMMddHHmmss' 형식으로 포맷팅하는 함수
  const formatDateTime = (date) => {
    const padZero = (num) => num.toString().padStart(2, '0');
    return (
      date.getFullYear().toString().slice(-2) +
      padZero(date.getMonth() + 1) +
      padZero(date.getDate()) +
      padZero(date.getHours()) +
      padZero(date.getMinutes()) +
      padZero(date.getSeconds())
    );
  };

  // 기기 데이터 분류 함수
  const classifyDevices = useCallback(() => {
    if (!Array.isArray(availableRings)) { // availableRings 사용
      console.error('availableRings 데이터가 배열이 아닙니다.');
      setConnectableDevices([]);
      setAssignedDevices([]);
      return;
    }


    // 들의 MacAddr 목록 수집
    const userMacAddrs = users.map(user => user.macAddr).filter(mac => mac);

    // 기기 상태에 따라 분류
    const connectable = availableRings.filter(
      ring => !userMacAddrs.includes(ring.MacAddr)
    );
    const assigned = availableRings.filter(ring =>
      userMacAddrs.includes(ring.MacAddr)
    );

    setConnectableDevices(connectable);
    setAssignedDevices(assigned);
  }, [availableRings, users]);

  // 컴포넌트 마운트 시 데이터 분류 및 선택된 사용자 설정
  useEffect(() => {
    const initializeData = async () => {
      if (setActiveComponent) {
        setActiveComponent('DeviceManagement');
      }

      // 컴포넌트 진입 시 즉시 데이터 업데이트
      if (fetchUsers) {
        await fetchUsers();
      }

      classifyDevices();
      setIsLoadingDevices(false);

      // 선택된 사용자 상태 설정
      if (location.state?.selectedUser) {
        setSelectedUser(location.state.selectedUser);
        setUserSearchTerm(''); // 검색어 초기화
      }
    };

    initializeData();

    return () => {
      if (setActiveComponent) {
        setActiveComponent('');
      }
    };
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // location.state가 변경될 때만 선택된 사용자 업데이트
  useEffect(() => {
    if (location.state?.selectedUser) {
      setSelectedUser(location.state.selectedUser);
      setUserSearchTerm('');
    }
  }, [location.state?.selectedUser]);

  // availableRings나 users가 변경될 때만 devices 분류
  useEffect(() => {
    classifyDevices();
  }, [classifyDevices, availableRings, users]);

  // 사용자 필터링 및 정렬
  const filteredUsers = useMemo(() => {
    const collator = new Intl.Collator('ko-KR', { sensitivity: 'base' });
    
    // 할당된 사용자 ID 목록
    const assignedUserIds = assignedUsers || [];
    
    let filtered = users
      .filter(user => !user.macAddr) // 링이 없는 사용자만 포함
      .filter(user => assignedUserIds.includes(user.id)) // 할당된 사용자만 포함
      .filter(user => user?.name?.toLowerCase().includes(userSearchTerm.toLowerCase()));

    // 선택된 사용자가 있으면 최상단으로 이동
    if (selectedUser) {
      filtered.sort((a, b) => {
        if (a.id === selectedUser.id) return -1;
        if (b.id === selectedUser.id) return 1;
        return collator.compare(a.name, b.name);
      });
    } else {
      filtered.sort((a, b) => collator.compare(a.name, b.name));
    }

    return filtered;
  }, [users, userSearchTerm, selectedUser, assignedUsers]);

  // 연결 가능한 링 목록을 정렬 (한글 ㄱㄴㄷ 순, 링 이름 없으면 '이름 없음'으로 처리)
  const sortedConnectableDevices = useMemo(() => {
    const collator = new Intl.Collator('ko-KR', { sensitivity: 'base' });

    return [...connectableDevices].sort((a, b) => {
      const nameA = a.Name || '이름 없음';
      const nameB = b.Name || '이름 없음';

      return collator.compare(nameA, nameB);
    });
  }, [connectableDevices]);

  // 연결된 링 목록을 정렬 (한글 ㄱㄴㄷ 순, 링 이름 없으면 '이름 없음'으로 처리)
  const sortedAssignedDevices = useMemo(() => {
    const collator = new Intl.Collator('ko-KR', { sensitivity: 'base' });

    return [...assignedDevices].sort((a, b) => {
      const nameA = a.Name || '이름 없음';
      const nameB = b.Name || '이름 없음';

      return collator.compare(nameA, nameB);
    });
  }, [assignedDevices]);

  // 드래그로 스롤 기능
  const handleMouseDown = e => {
    isDragging.current = true;
    startY.current = e.pageY - userListRef.current.offsetTop;
    scrollTop.current = userListRef.current.scrollTop;
  };

  const handleMouseMove = e => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY - userListRef.current.offsetTop;
    const walk = y - startY.current;
    userListRef.current.scrollTop = scrollTop.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 기기 이름 편집 시작
  const startEditingDeviceName = (deviceMacAddr, currentName) => {
    setEditingDeviceMacAddr(deviceMacAddr);
    setNewDeviceName(currentName);
  };

  // 기기 이름 업데이트
  const updateDeviceName = async (deviceMacAddr) => {
    try {
      const requestBody = {
        Header: {
          SiteId: siteId,
          Values: [],
        },
        Data: {
          Name: newDeviceName,
          MacAddr: deviceMacAddr,
        },
      };

      const response = await axios.post(`${url}/api/ring`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status === 200) {
        // `fetchUsers`를 호출하여 최신 데이터 가져옵니다.
        if (fetchUsers) {
          await fetchUsers();
        }
        classifyDevices(); // 변경된 availableRings로 다시 분류

        // 편집 모달 종료
        setEditingDeviceMacAddr(null);
        setNewDeviceName('');
      } else {
        console.error('링 이름 업데이트 실패:', response.data);
        alert('링 이름 업데이트에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('링 이름 업데이트 오류:', error);
      alert('링 이름 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 사용자에게 링 할당 및 해제
  const updateUserRing = async (user, ring, action) => {
    try {
      const updatedUser = {
        ...user,
        ring: action === 'assign' ? ring : null,
        macAddr: action === 'assign' ? ring.MacAddr : '',
      };

      // 현재 시간을 'yyMMddHHmmss' 형식으로 
      const ringSettingDateTime =
        action === 'assign' ? formatDateTime(new Date()) : '';

      const requestBody = {
        header: {
          siteId: siteId,
        },
        data: {
          Id: updatedUser.id,
          Gender: updatedUser.gender || 0,
          Name: updatedUser.name,
          Age: updatedUser.age,
          Address: updatedUser.address || '',
          StepTarget: updatedUser.stepTarget || 10000,
          KcalTarget: updatedUser.kcalTarget || 2000,
          KmTarget: updatedUser.kmTarget || 5,
          MacAddr: updatedUser.macAddr || '',
          ...(action === 'assign' && { RingSettingDateTime: ringSettingDateTime }),
          LifeLogs: updatedUser.lifeLogs.map(log => ({
            IsChecked: log.taken,
            LogContent: log.medicine,
            LogDateTime: `${log.date}T${log.time}:00+00:00`,
            Description: log.dose,
          })),
          WarningHeartRate: [
            updatedUser.thresholds.heartRateWarningLow,
            updatedUser.thresholds.heartRateWarningHigh,
          ],
          DangersHeartRate: [
            updatedUser.thresholds.heartRateDangerLow,
            updatedUser.thresholds.heartRateDangerHigh,
          ],
          Favorite: updatedUser.isFavorite,
        },
      };

      const response = await axios.post(`${url}/api/user`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status === 200) {
        // 즉시 로컬 상태 업데이트
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === updatedUser.id ? updatedUser : u
          )
        );
        
        // 즉시 기기 분류 업데이트
        classifyDevices();
        
        setShowConfirmationModal(false);
        setSelectedUser(null);

        // 백그라운드에서 전체 데이터 새로고침
        if (fetchUsers) {
          fetchUsers();
        }
      } else {
        console.error('사용자 업데이트 실패:', response.statusText);
        alert('사용자 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      alert('사용자 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleDeviceClick = (device, isAssigned) => {
    if (isAssigned) {
      const userWithDevice = users.find(user => user.macAddr === device.MacAddr);
      if (!userWithDevice) {
        alert('이 기기에 할당된 사용자를 찾을 수 없습니다.');
        return;
      }
      setSelectedUser(userWithDevice);
      setSelectedDevice(device);
      setModalAction('unassign');
      setShowConfirmationModal(true);
    } else {
      // 연결 가능한 기기를 클릭했을 때
      if (!selectedUser) {
        alert('먼저 사용자를 선택해주세요.');
        return;
      }
      setSelectedDevice(device);
      setModalAction('assign');
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmAction = () => {
    if (modalAction === 'assign') {
      updateUserRing(selectedUser, selectedDevice, 'assign');
    } else if (modalAction === 'unassign') {
      updateUserRing(selectedUser, selectedDevice, 'unassign');
    }
  };

  // Filtered ring lists based on search terms
  const filteredConnectableDevices = useMemo(() => {
    return sortedConnectableDevices.filter(ring => {
      const ringName = ring.Name || '이름 없음';
      return ringName.toLowerCase().includes(connectableSearchTerm.toLowerCase());
    });
  }, [sortedConnectableDevices, connectableSearchTerm]);
  

  const filteredAssignedDevices = useMemo(() => {
    const lowerSearchTerm = assignedSearchTerm.toLowerCase();
    
    return sortedAssignedDevices.filter(ring => {
      const ringName = ring.Name?.toLowerCase() || '';
      const assignedUser = users.find(user => user.macAddr === ring.MacAddr);
      const userName = assignedUser?.name?.toLowerCase() || '';
      
      return ringName.includes(lowerSearchTerm) || userName.includes(lowerSearchTerm);
    });
  }, [sortedAssignedDevices, assignedSearchTerm, users]);

  // 컴포넌트 마운트 시 사용자 이름으로 검색 및 선택
  useEffect(() => {
    if (initialSearchTerm) {
      setUserSearchTerm(initialSearchTerm);
      setSearchTerm(initialSearchTerm);
    }
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser.name);
    }
  }, [initialSearchTerm, initialSelectedUser]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header 
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        siteName={siteId}
        userName={userName}
        setShowModal={() => {}}
        setSearchQuery={setSearchTerm}
        sortOption=""
        setSortOption={() => {}}
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* 사용자 리스트 */}
          <div className="w-full md:w-1/3 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">사용자 목록</h2>
            {/* 사용자 검색 입력 */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="사용자 검색..."
                value={userSearchTerm}
                onChange={e => {
                  setUserSearchTerm(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                aria-label="사용자 검색 입력"
              />
              {userSearchTerm && (
                <button
                  onClick={() => {
                    setUserSearchTerm('');
                    setSearchTerm('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(33vh-100px)] md:max-h-[calc(100vh-250px)] p-2">
              {filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>사용자 목록이 없습니다.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredUsers.map(user => (
                    <li
                      key={user.id}
                      className={`p-4 bg-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer ${
                        selectedUser && selectedUser.id === user.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'border border-gray-100'
                      }`}
                      onClick={() => {
                        if (selectedUser && selectedUser.id === user.id) {
                          setSelectedUser(null);
                        } else {
                          setSelectedUser(user);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name || '이름 없음'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {user.gender === 0 ? '남성' : '여성'}, {user.age}세
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 연결 가능한 링 목록 */}
          <div className="w-full md:w-1/3 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">연결 가능한 링 목록</h2>
            {/* 연결 가능한 링 검색 입력 */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="링 검색..."
                value={connectableSearchTerm}
                onChange={e => setConnectableSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                aria-label="연결 가능한 링 검색 입력"
              />
              {connectableSearchTerm && (
                <button
                  onClick={() => setConnectableSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(33vh-100px)] md:max-h-[calc(100vh-250px)] p-2">
              {isLoadingDevices ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>링 목록 로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConnectableDevices.map(ring => (
                    <div
                      key={ring.MacAddr}
                      className="p-4 bg-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer border border-gray-100"
                      onClick={() => handleDeviceClick(ring, false)}
                      title={`MAC 주소: ${ring.MacAddr}`}
                    >
                      <div className="flex items-center">
                        <FaRing className="text-gray-400 mr-3" size={20} />
                        <div className="flex-1">
                          {editingDeviceMacAddr === ring.MacAddr ? (
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={newDeviceName}
                                onChange={(e) => setNewDeviceName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg mr-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateDeviceName(editingDeviceMacAddr);
                                }}
                                className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                aria-label="링 이름 저장"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDeviceMacAddr(null);
                                  setNewDeviceName('');
                                }}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"
                                aria-label="링 이름 편집 취소"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <h3 className="text-gray-900 font-medium flex-1">{ring.Name || '이름 없음'}</h3>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  startEditingDeviceName(ring.MacAddr, ring.Name);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                                aria-label="링 이름 편집"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">MAC: {ring.MacAddr}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 연결된 링 목록 */}
          <div className="w-full md:w-1/3 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">연결된 링 목록</h2>
            {/* 연결된 링 검색 입력 */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="링 검색..."
                value={assignedSearchTerm}
                onChange={e => setAssignedSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                aria-label="연결된 링 검색 입력"
              />
              {assignedSearchTerm && (
                <button
                  onClick={() => setAssignedSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(33vh-100px)] md:max-h-[calc(100vh-250px)] p-2">
              {isLoadingDevices ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>링 목록 로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAssignedDevices.map(ring => {
                    const assignedUser = users.find(user => user.macAddr === ring.MacAddr);
                    return (
                      <div
                        key={ring.MacAddr}
                        className="p-4 bg-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer border border-gray-100"
                        onClick={() => handleDeviceClick(ring, true)}
                      >
                        <div className="flex items-center">
                          <FaRing className="text-blue-500 mr-3" size={20} />
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-medium">
                              {ring.Name || '이름 없음'}
                            </h3>
                            {assignedUser && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-500">
                                  {`${assignedUser.name || '이름 없음'}(${assignedUser.gender === 0 ? '남' : '여'}, ${
                                    assignedUser.age || '알 수 없음'
                                  }세)`}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-gray-500 mt-1">MAC: {ring.MacAddr}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmationModal && selectedDevice && (
        <Modal onClose={() => setShowConfirmationModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">확인</h2>
            <p className="mb-6 text-gray-600">
              {modalAction === 'assign'
                ? `링 "${selectedDevice.Name || '이름 없음'}"을(를) 사용자 "${selectedUser.name}"에게 연결하시겠습니까?`
                : `사용자 "${selectedUser.name}"로부터 링 "${selectedDevice.Name || '이름 없음'}"을(를) 연결 해제하시겠습니까?`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeviceManagement;
