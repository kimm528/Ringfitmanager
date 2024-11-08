// src/App.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// 필요한 컴포넌트 임포트
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDetail from './components/UserDetail';
import Login from './components/Login';
import Settings from './components/Settings';
import FloorPlan from './components/FloorPlan';

// 기본 프로필 이미지 URL 설정
const defaultProfileImage = 'https://via.placeholder.com/150?text=No+Image';

// 로컬 스토리지 관련 헬퍼 함수
const loadFromLocalStorage = (key, defaultValue) => {
  if (key === 'users') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = (key, value) => {
  if (key === 'users') return;
  localStorage.setItem(key, JSON.stringify(value));
};

// 날짜를 'YYMMDD' 형식으로 반환하는 함수
const getCurrentYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

// Sidebar 상태를 경로에 따라 제어하는 컴포넌트
const SidebarController = ({
  isSidebarOpen,
  setIsSidebarOpen,
  children,
  // 기타 필요한 props 추가
}) => {
  const location = useLocation();

  useEffect(() => {
    console.log('현재 경로:', location.pathname);
    if (location.pathname === '/floorplan') {
      setIsSidebarOpen(false);
      console.log('Sidebar 닫힘');
    }
    // /floorplan 외의 경로에서는 Sidebar 상태를 변경하지 않음
  }, [location.pathname, setIsSidebarOpen]);

  return children;
};

function App() {
  // 상태 변수들
  const [isLoggedIn, setIsLoggedIn] = useState(loadFromLocalStorage('isLoggedIn', false));
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]); // 빈 배열로 초기화
  const [sortOption, setSortOption] = useState('name');
  const [availableRings, setAvailableRings] = useState([]); // 링 데이터를 저장할 상태 추가
  const [successMessage, setSuccessMessage] = useState('');
  const [disconnectInterval, setDisconnectInterval] = useState(5);

  // 동적 siteId 상태 추가
  const [siteId, setSiteId] = useState(loadFromLocalStorage('siteId', ''));

  // 사용자 및 링 데이터 가져오기 함수
  const fetchUsersAndRingData = useCallback(async () => {
    if (!siteId) {
      console.warn('siteId가 설정되지 않았습니다.');
      return;
    }
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const userResponse = await axios.get(
        `https://fitlife.dotories.com/api/user?siteId=${siteId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const jsonData = JSON.parse(userResponse.data);
      const userData = jsonData.Data || [];

      // 링 데이터 가져오기
      const currentDate = getCurrentYYMMDD();
      const ringUrl = `https://fitlife.dotories.com/api/ring?siteId=${siteId}&yearMonthDay=${currentDate}`;

      let ringData = [];
      try {
        const ringResponse = await axios.get(ringUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        });

        const jsonRing = JSON.parse(ringResponse.data);
        ringData = jsonRing.Data || [];
      } catch (ringError) {
        console.warn('링 데이터 가져오기 실패:', ringError.message);
        ringData = [];
      }

      setAvailableRings(ringData);

      const updatedUsers = userData.map((user) => {
        const userRingData = ringData.find((ring) => ring.MacAddr === user.MacAddr) || null;

        // LifeLogs 처리
        const lifeLogs = (user.LifeLogs || []).map((log, index) => {
          const logDateTime = log.LogDateTime || '';
          const dateTimeParts = logDateTime.split('T');
          const date = dateTimeParts[0] || '';
          const timePart = dateTimeParts[1] || '';
          const time = timePart.substring(0, 5) || '';

          return {
            id: index + 1,
            medicine: log.LogContent,
            date: date,
            time: time,
            dose: log.Description,
            taken: log.IsChecked,
          };
        });

        return {
          id: user.Id,
          name: user.Name,
          gender: user.Gender,
          age: user.Age,
          profileImage: user.TitleImagePath || defaultProfileImage,
          address: user.Address,
          stepTarget: user.StepTarget || 10000,
          kcalTarget: user.KcalTarget || 2000,
          kmTarget: user.KmTarget || 5,
          macAddr: user.MacAddr || '',
          albumPath: user.AlbumPath || [],
          lifeLogs: lifeLogs,
          ring: userRingData,
          data: {
            bpm: userRingData?.BPM || 0,
            oxygen: userRingData?.Oxygen || 0,
            stress: userRingData?.Stress || 0,
            sleep: userRingData?.Sleep || 0,
            steps: userRingData?.Steps || 0,
            calories: userRingData?.Calories || 0,
            distance: userRingData?.Distance || 0,
            lineData: [],
            barData: [],
          },
          thresholds: {
            heartRateWarningLow: user.WarningHeartRate ? user.WarningHeartRate[0] : 80,
            heartRateWarningHigh: user.WarningHeartRate ? user.WarningHeartRate[1] : 120,
            heartRateDangerLow: user.DangersHeartRate ? user.DangersHeartRate[0] : 70,
            heartRateDangerHigh: user.DangersHeartRate ? user.DangersHeartRate[1] : 140,
          },
          isFavorite: user.Favorite || false,
        };
      });

      setUsers(updatedUsers);
    } catch (error) {
      console.error('사용자 또는 링 데이터 가져오기 실패:', error.response || error.message);
    }
  }, [siteId]);

  // 주기적인 데이터 업데이트
  useEffect(() => {
    if (!isLoggedIn || !siteId) return;

    const intervalId = setInterval(() => {
      console.log('30초마다 사용자 및 링 데이터 가져오기');
      fetchUsersAndRingData();
    }, 30000); // 30초

    return () => clearInterval(intervalId);
  }, [fetchUsersAndRingData, isLoggedIn, siteId]);

  // 초기 데이터 로드
  useEffect(() => {
    if (isLoggedIn && siteId) {
      setUsers([]); // 이전 사용자 데이터 초기화
      fetchUsersAndRingData(); // 새로운 데이터 가져오기
    }
  }, [isLoggedIn, siteId, fetchUsersAndRingData]);

  // 새로운 ID 생성 함수
  const getNewId = (users) => {
    const existingIds = users.map((user) => user.id).sort((a, b) => a - b);
    let newId = 1;

    for (let i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== newId) {
        break;
      }
      newId++;
    }
    return newId;
  };

  // 사용자 추가 함수
  const handleAddUser = useCallback(
    async (newUser) => {
      if (!siteId) {
        alert('사이트 ID가 설정되지 않았습니다.');
        return;
      }

      try {
        const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
        const apiUrl = 'https://fitlife.dotories.com/api/user';
        const gender = newUser.gender === '남성' || newUser.gender === 0 ? 0 : 1;
        let newId = getNewId(users);

        // 서버에 사용자 추가 요청
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
              command: 6, // 사용자 추가 명령 코드
              'siteId': siteId,
            },
            data: {
              Id: newId,
              TitleImagePath: newUser.profileImage || '',
              Gender: gender,
              Name: newUser.name,
              Age: newUser.age,
              Address: newUser.address || '',
              StepTarget: newUser.stepTarget || 10000,
              KcalTarget: newUser.kcalTarget || 2000,
              KmTarget: newUser.kmTarget || 5,
              MacAddr: newUser.macAddr || '',
              AlbumPath: newUser.albumPath || [],
              LifeLogs: [],
            },
          }),
        });

        const responseText = await response.text();

        if (response.ok && responseText.includes('User Insert success')) {
          console.log('사용자 추가 성공:', responseText);

          const createdUser = {
            id: newId,
            name: newUser.name,
            gender: gender,
            age: newUser.age,
            profileImage: newUser.profileImage || defaultProfileImage,
            address: newUser.address || '',
            stepTarget: newUser.stepTarget || 10000,
            kcalTarget: newUser.kcalTarget || 2000,
            kmTarget: newUser.kmTarget || 5,
            macAddr: newUser.macAddr || '',
            albumPath: newUser.albumPath || [],
            lifeLogs: [],
            ring: null,
            isFavorite: false,
            data: {
              bpm: 0,
              oxygen: 0,
              stress: 0,
              sleep: 0,
              steps: 0,
              calories: 0,
              distance: 0,
              lineData: [],
              barData: [],
            },
            thresholds: {
              heartRateWarningLow: 80,
              heartRateWarningHigh: 120,
              heartRateDangerLow: 70,
              heartRateDangerHigh: 140,
            },
          };

          setUsers((prevUsers) => {
            const updatedUsers = [...prevUsers, createdUser];
            return updatedUsers;
          });

          setShowModal(false);

          // 성공 메시지 설정
          setSuccessMessage('사용자가 추가되었습니다.');

          // 3초 후 메시지 자동 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          console.error('서버에 사용자 추가 실패:', responseText);
          alert('서버에 사용자를 추가하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 추가 오류:', error);
        alert('사용자 추가 중 오류가 발생했습니다.');
      }
    },
    [users, siteId]
  );

  // 사용자 업데이트 함수
  const updateUser = useCallback(
    async (updatedUser, sendToServer = false) => {
      console.log('사용자 업데이트:', updatedUser);

      // 로컬 상태 업데이트
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((u) =>
          u.id === updatedUser.id ? { ...u, ...updatedUser } : u
        );
        return updatedUsers;
      });

      // 서버에 업데이트 요청
      if (sendToServer && siteId) {
        try {
          const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
          const apiUrl = 'https://fitlife.dotories.com/api/user';
          const gender = updatedUser.gender === 0 ? 0 : 1;

          // 서버에 사용자 업데이트 요청
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify({
              header: {
                command: 6, // 사용자 업데이트 명령 코드
                siteId: siteId,
              },
              data: {
                Id: updatedUser.id,
                TitleImagePath: updatedUser.profileImage || '',
                Gender: gender,
                Name: updatedUser.name,
                Age: updatedUser.age,
                Address: updatedUser.address || '',
                StepTarget: updatedUser.stepTarget || 10000,
                KcalTarget: updatedUser.kcalTarget || 2000,
                KmTarget: updatedUser.kmTarget || 5,
                MacAddr: updatedUser.macAddr || '',
                AlbumPath: updatedUser.albumPath || [],
                LifeLogs: updatedUser.lifeLogs.map((log) => ({
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
            }),
          });

          const responseText = await response.text();

          if (response.ok && responseText.includes('User update success')) {
            console.log('서버에서 사용자 업데이트 성공.');
            setSuccessMessage('수정이 완료되었습니다.');

            // 3초 후 성공 메시지 제거
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000);
          } else {
            console.error('서버에서 사용자 업데이트 실패:', responseText);
            alert('서버에 사용자 정보를 업데이트하는 데 실패했습니다.');
          }
        } catch (error) {
          console.error('사용자 업데이트 오류:', error);
          alert('사용자 정보 업데이트 중 오류가 발생했습니다.');
        }
      }
    },
    [siteId]
  );

  // 사용자 삭제 함수
  const deleteUser = useCallback(
    async (userId) => {
      console.log('사용자 삭제 ID:', userId);

      try {
        const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
        const apiUrl = 'https://fitlife.dotories.com/api/user';

        const response = await fetch(`${apiUrl}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
              command: 8, // 사용자 삭제 명령 코드
              siteId: siteId,
            },
            data: {
              Id: userId,
            },
          }),
        });

        if (response.ok) {
          console.log('서버에서 사용자 삭제 성공.');

          // 로컬 상태 업데이트
          setUsers((prevUsers) => {
            const updatedUsers = prevUsers.filter((user) => user && user.id !== userId);
            return updatedUsers;
          });

          // 성공 메시지 설정
          setSuccessMessage('사용자가 성공적으로 삭제되었습니다.');

          // 3초 후 메시지 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          console.error('서버에서 사용자 삭제 실패.');
          alert('서버에서 사용자 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 삭제 오류:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    },
    [siteId]
  );

  // 즐겨찾기 토글 함수
  const toggleFavorite = useCallback(
    (userId) => {
      const userToUpdate = users.find((user) => user.id === userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate, isFavorite: !userToUpdate.isFavorite };

        // 서버에 업데이트
        updateUser(updatedUser, true);

        // 로컬 상태 업데이트
        setUsers((prevUsers) => {
          const updatedUsers = prevUsers.map((user) =>
            user.id === userId ? updatedUser : user
          );
          return updatedUsers;
        });
      }
    },
    [users, updateUser]
  );

  // 관리자 정보 수정 함수
  const handleUpdateAdminInfo = useCallback(
    async (updatedAdminInfo) => {
      if (!siteId) {
        alert('사이트 ID가 설정되지 않았습니다.');
        return;
      }

      try {
        const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
        const apiUrl = 'https://fitlife.dotories.com/api/admin'; // 관리자 정보 수정 API 엔드포인트

        const response = await fetch(apiUrl, {
          method: 'POST', // 관리자 정보 수정을 위한 POST 메서드
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
              command: 7, // 관리자 정보 수정 명령 코드
              siteId: siteId,
            },
            data: {
              AdminId: updatedAdminInfo.adminId,
              Password: updatedAdminInfo.password,
            },
          }),
        });

        const responseData = await response.json();

        if (response.ok && responseData.status !== 'ExistsId') {
          console.log('관리자 정보 수정 성공:', responseData);
          saveToLocalStorage('adminInfo', updatedAdminInfo);
          setSuccessMessage('관리자 정보가 성공적으로 수정되었습니다.');

          // 3초 후 성공 메시지 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else if (responseData.status === 'ExistsId') {
          alert('아이디가 이미 존재합니다. 다른 아이디를 사용해주세요.');
        } else {
          console.error('관리자 정보 수정 실패:', responseData);
          alert('관리자 정보 수정에 실패했습니다.');
        }
      } catch (error) {
        console.error('관리자 정보 수정 오류:', error);
        alert('관리자 정보 수정 중 오류가 발생했습니다.');
      }
    },
    [siteId]
  );

  return (
    <Router>
      {isLoggedIn ? (
        <SidebarController
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        >
          <div className="flex h-screen bg-gray-100">
            {/* 성공 메시지 모달 */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
              {successMessage && (
                <div className="bg-green-500 text-white px-4 py-2 rounded shadow">
                  {successMessage}
                </div>
              )}
            </div>

            {/* 사이드바와 메인 콘텐츠 */}
            <div className="flex flex-1">
              <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                users={users}
                setIsLoggedIn={setIsLoggedIn}
                sortOption={sortOption}
                setSortOption={setSortOption}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <div className="flex-1 overflow-y-auto flex flex-col">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <Header setShowModal={setShowModal} setSearchQuery={setSearchQuery} />
                        <main className="p-4 flex-1">
                          <Dashboard
                            showModal={showModal}
                            setShowModal={setShowModal}
                            users={users}
                            setUsers={setUsers}
                            searchQuery={searchQuery}
                            handleAddUser={handleAddUser}
                            updateUser={updateUser}
                            deleteUser={deleteUser}
                            sortOption={sortOption}
                            setSortOption={setSortOption}
                            toggleFavorite={toggleFavorite}
                            availableRings={availableRings}
                            disconnectInterval={disconnectInterval}
                          />
                        </main>
                      </>
                    }
                  />
                  <Route
                    path="/users/:userId"
                    element={
                      <UserDetail
                        users={users}
                        updateUserLifeLog={updateUser}
                        siteId={siteId}
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        handleUpdateAdminInfo={handleUpdateAdminInfo}
                        users={users}
                        deleteUser={deleteUser}
                        siteId={siteId}
                        disconnectInterval={disconnectInterval}
                        setDisconnectInterval={setDisconnectInterval}
                      />
                    }
                  />
                  <Route
                    path="/floorplan"
                    element={<FloorPlan ringData={availableRings} users={users} />}
                    />
                </Routes>
              </div>
            </div>
          </div>
        </SidebarController>
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn} setSiteId={setSiteId} />
      )}
    </Router>
  );
}

export default App;
