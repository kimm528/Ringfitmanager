import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FaGem } from 'react-icons/fa'; // FaGem 아이콘 임포트
import Header from './Header.js';
import Modal from './Modal.js';

const DeviceManagement = ({ users, setUsers, siteId, fetchUsers, setActiveComponent, devices, availableRings }) => {
  const [connectableDevices, setConnectableDevices] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [editingDeviceMacAddr, setEditingDeviceMacAddr] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalAction, setModalAction] = useState('assign');

  const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
  const url = 'https://fitlife.dotories.com';

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
  
    console.log('classifyDevices 호출:', { availableRings, users });
  
    // 사용자들의 MacAddr 목록 수집
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

  // 컴포넌트 마운트 시 데이터 분류
  useEffect(() => {
    if (setActiveComponent) {
      setActiveComponent('DeviceManagement');
    }

    classifyDevices();
    setIsLoadingDevices(false);

    return () => {
      if (setActiveComponent) {
        setActiveComponent('');
      }
    };
  }, [setActiveComponent, classifyDevices]);

  // 사용자 필터링
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // 드래그로 스크롤 기능
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
        // `fetchUsers`를 호출하여 최신 데이터를 가져옵니다.
        if (fetchUsers) {
          await fetchUsers();
        }
        classifyDevices(); // 변경된 availableRings로 다시 분류

        // 편집 모드 종료
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

      // 현재 시간을 'yyMMddHHmmss' 형식으로 포맷팅
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

      // 서버에 사용자 정보 업데이트 요청
      const response = await axios.post(`${url}/api/user`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status === 200) {
        if (fetchUsers) {
          await fetchUsers();
        }
        classifyDevices(); // 변경된 availableRings로 다시 분류

        setShowConfirmationModal(false);
        setSelectedUser(null); // 선택된 사용자 초기화
      } else {
        console.error('사용자 업데이트 실패:', response.statusText);
        alert('사용자 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      alert('사용자 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 기기 클릭 시 처리
  const handleDeviceClick = (device, isAssigned) => {
    if (isAssigned) {
      // 이미 연결된 기기를 클릭했을 때
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

  // 확인 모달에서 확인 버튼 클릭 시 처리
  const handleConfirmAction = () => {
    if (modalAction === 'assign') {
      updateUserRing(selectedUser, selectedDevice, 'assign');
    } else if (modalAction === 'unassign') {
      updateUserRing(selectedUser, selectedDevice, 'unassign');
    }
  };

  // **추가된 useEffect: availableRings이나 users가 변경될 때 classifyDevices 호출**
  useEffect(() => {
    console.log('availableRings 또는 users가 변경되었습니다:', { availableRings, users });
    classifyDevices();
  }, [availableRings, users, classifyDevices]);

  return (
    <div className="flex flex-col h-screen pt-20">
      <Header setShowModal={() => {}} setSearchQuery={setSearchTerm} />

      <div className="flex flex-1 overflow-hidden">
        {/* 사용자 리스트 */}
        <div className="w-full sm:w-1/3 pr-4 flex flex-col mt-4 px-4">
          <h2 className="text-xl font-semibold mb-4">사용자 목록</h2>
          {/* 사용자 검색 입력 */}
          <input
            type="text"
            placeholder="사용자 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-4 p-2 border border-gray-300 rounded-md w-full"
            aria-label="사용자 검색 입력"
          />
          {/* 사용자 목록 */}
          <div
            ref={userListRef}
            className="flex-1 overflow-y-scroll custom-scrollbar cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p>사용자 목록이 없습니다.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredUsers.map(user => (
                  <li
                    key={user.id}
                    className={`p-4 bg-gray-100 rounded-md shadow-sm flex items-center cursor-pointer ${
                      selectedUser && selectedUser.id === user.id ? 'border border-blue-500' : ''
                    }`}
                    onClick={() => {
                      if (selectedUser && selectedUser.id === user.id) {
                        setSelectedUser(null);
                      } else {
                        setSelectedUser(user);
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.name || '이름 없음'}</p>
                      <p className="text-sm text-gray-600">
                        {user.gender === 0 ? '남성' : '여성'}, {user.age}세
                      </p>
                    </div>
                    {user.ring && (
                      <div className="ml-4">
                        <p className="text-sm font-medium">할당된 링:</p>
                        <p className="text-sm text-gray-700">{user.ring.Name || '이름 없음'}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 연결 가능한 링 목록 */}
        <div className="w-full sm:w-1/3 px-2 mt-4 px-4">
          <h2 className="text-xl font-semibold mb-4">연결 가능한 링 목록</h2>
          <div className="grid grid-cols-1 gap-4">
            {isLoadingDevices ? (
              <div className="flex items-center justify-center h-full">
                <p>링 목록 로딩 중...</p>
              </div>
            ) : (
              connectableDevices.map(ring => (
                <div
                  key={ring.MacAddr}
                  className="p-4 bg-white rounded-md shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleDeviceClick(ring, false)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                      <FaGem className="text-gray-600" size={24} /> {/* FaGem 아이콘 사용 */}
                    </div>
                    <div className="flex-1">
                      {editingDeviceMacAddr === ring.MacAddr ? (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 border border-gray-300 rounded mr-2 flex-1"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDeviceName(editingDeviceMacAddr);
                            }}
                            className="text-green-500 hover:text-green-700"
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
                            className="text-red-500 hover:text-red-700 ml-2"
                            aria-label="링 이름 편집 취소"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium flex-1">{ring.Name || '이름 없음'}</h3>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              startEditingDeviceName(ring.MacAddr, ring.Name);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="링 이름 편집"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        MAC 주소: {ring.MacAddr || '없음'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 연결된 링 목록 */}
        <div className="w-full sm:w-1/3 pl-4 mt-4 px-4">
          <h2 className="text-xl font-semibold mb-4">연결된 링 목록</h2>
          <div className="grid grid-cols-1 gap-4">
            {isLoadingDevices ? (
              <div className="flex items-center justify-center h-full">
                <p>링 목록 로딩 중...</p>
              </div>
            ) : (
              assignedDevices.map(ring => (
                <div
                  key={ring.MacAddr}
                  className="p-4 bg-gray-200 rounded-md shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleDeviceClick(ring, true)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center mr-4">
                      <FaGem className="text-gray-600" size={24} /> {/* FaGem 아이콘 사용 */}
                    </div>
                    <div className="flex-1">
                      {editingDeviceMacAddr === ring.MacAddr ? (
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            className="p-1 border border-gray-300 rounded mr-2 flex-1"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDeviceName(editingDeviceMacAddr);
                            }}
                            className="text-green-500 hover:text-green-700"
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
                            className="text-red-500 hover:text-red-700 ml-2"
                            aria-label="링 이름 편집 취소"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium flex-1">
                            {ring.Name || '이름 없음'}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingDeviceName(ring.MacAddr, ring.Name);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="링 이름 편집"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        MAC 주소: {ring.MacAddr || '없음'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 확인 모달 */}
      {showConfirmationModal && selectedDevice && (
        <Modal onClose={() => setShowConfirmationModal(false)}>
          <h2 className="text-xl font-semibold mb-4">확인</h2>
          <p>
            {modalAction === 'assign'
              ? `링 "${selectedDevice.Name || '이름 없음'}"을(를) 사용자 "${selectedUser.name}"에게 연결하시겠습니까?`
              : `사용자 "${selectedUser.name}"로부터 링 "${selectedDevice.Name || '이름 없음'}"을(를) 연결 해제하시겠습니까?`}
          </p>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowConfirmationModal(false)}
              className="px-4 py-2 bg-gray-300 text-black rounded-md mr-2"
            >
              취소
            </button>
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              확인
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeviceManagement;
