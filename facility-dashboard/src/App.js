// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDetail from './components/UserDetail';
import Login from './components/Login';
import Settings from './components/Settings'; // Settings 컴포넌트 추가

// 기본 프로필 이미지 URL 설정
const defaultProfileImage = 'https://via.placeholder.com/150?text=No+Image';


// Helper functions for localStorage operations
const loadFromLocalStorage = (key, defaultValue) => {
  // 'users' 키에 대한 로컬 스토리지 접근을 차단
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
  // 'users' 키에 대한 로컬 스토리지 저장을 차단
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(loadFromLocalStorage('isLoggedIn', false));
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]); // 빈 배열로 초기화
  const [sortOption, setSortOption] = useState('name');
  const [availableRings, setAvailableRings] = useState([]); // 링 데이터를 저장할 상태 추가
  const [successMessage, setSuccessMessage] = useState('');


  // 동적 siteId 상태 추가
  const [siteId, setSiteId] = useState(loadFromLocalStorage('siteId', ''));


  // Fetch Users and Ring Data from API
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
  
      const userData = userResponse.data.Data || [];
  
      // Fetch Ring Data
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
  
        ringData = ringResponse.data.Data || [];
      } catch (ringError) {
        console.warn('Failed to fetch ring data, proceeding without it:', ringError.message);
        ringData = [];
      }
  
      setAvailableRings(ringData);
  
      const updatedUsers = userData.map((user) => {
        const userRingData = ringData.find((ring) => ring.MacAddr === user.MacAddr) || null;
  
        // LifeLogs 처리 시 오류 방지
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
      console.error('Failed to fetch user or ring data:', error.response || error.message);
    }
  }, [siteId]);

  // 주기적인 데이터 업데이트
  useEffect(() => {
    if (!isLoggedIn || !siteId ) return;

    const intervalId = setInterval(() => {
      console.log('Fetching users and ring data every 30 seconds');
      fetchUsersAndRingData();
    }, 30000); // 30초

    return () => clearInterval(intervalId);
  }, [fetchUsersAndRingData, isLoggedIn, siteId]);

  // Initial Load
  useEffect(() => {
    if (isLoggedIn && siteId) {
      setUsers([]); // 이전 사용자 데이터 초기화
      fetchUsersAndRingData(); // 새로운 데이터 가져오기
    }
  }, [isLoggedIn, siteId, fetchUsersAndRingData]);

  const getNewId = (users) => {
    const existingIds = users.map((user) => user.id).sort((a, b) => a - b); // ID 정렬
    let newId = 1;

    // 비어있는 ID 확인
    for (let i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== newId) {
        // 비어있는 ID 발견 시 즉시 할당
        break;
      }
      newId++;
    }
    return newId;
  };

  // Add User Handler (서버로 POST 요청 추가)
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

        // 새 사용자 데이터를 서버로 POST 요청
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
              command: 6, // 사용자 추가를 위한 명령 코드
              siteId: siteId, // 동적 siteId 추가
            },
            data: {
              Id: newId, // 새로운 ID 할당
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
          console.log('User added successfully:', responseText);

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
            // 로컬 스토리지 저장 부분 제거
            // saveToLocalStorage('users', updatedUsers);
            return updatedUsers;
          });

          setShowModal(false);

          // 사용자 추가 성공 메시지 설정
          setSuccessMessage('사용자가 추가되었습니다.');

          // 일정 시간 후 메시지를 자동으로 사라지게 설정 (3초 후)
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          console.error('Failed to add user on server:', responseText);
          alert('서버에 사용자를 추가하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert('사용자 추가 중 오류가 발생했습니다.');
      }
    },
    [users, siteId]
  );

  // Update User Handler (서버로 POST 요청 추가)
  const updateUser = useCallback(
    async (updatedUser, sendToServer = false) => {
      console.log('Updating user:', updatedUser);

      // 로컬 상태 업데이트
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((u) =>
          u.id === updatedUser.id ? { ...u, ...updatedUser } : u
        );
        return updatedUsers;
      });

      // 서버로 POST 요청을 보낼지 여부를 결정
      if (sendToServer && siteId) {
        try {
          const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
          const apiUrl = 'https://fitlife.dotories.com/api/user';
          const gender = updatedUser.gender === 0 ? 0 : 1;

          // 수정된 사용자 데이터를 서버로 POST 요청
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify({
              header: {
                command: 6, // 사용자 업데이트를 위한 명령 코드
                siteId: siteId, // 동적 siteId 추가
              },
              data: {
                Id: updatedUser.id, // 업데이트할 사용자 ID
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
            console.log('User updated successfully on server.');
            setSuccessMessage('수정이 완료되었습니다.');

            // 일정 시간 후 성공 메시지 제거
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000); // 3초 후 메시지 사라짐
          } else {
            console.error('Failed to update user on server:', responseText);
            alert('서버에 사용자 정보를 업데이트하는 데 실패했습니다.');
          }
        } catch (error) {
          console.error('Error updating user:', error);
          alert('사용자 정보 업데이트 중 오류가 발생했습니다.');
        }
      }
    },
    [siteId]
  );

  // Delete User Handler
  const deleteUser = useCallback(
    async (userId) => {
      console.log('Deleting user with ID:', userId);

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
              command: 8, // 사용자 삭제를 위한 명령 코드
              siteId: siteId, // 동적 siteId 추가
            },
            data: {
              Id: userId,
            },
          }),
        });

        // HTTP 상태 코드가 성공 범위에 있는지 확인
        if (response.ok) {
          console.log('User deleted successfully on server.');

          // 로컬 상태 업데이트
          setUsers((prevUsers) => {
            const updatedUsers = prevUsers.filter((user) => user && user.id !== userId);
            return updatedUsers;
          });

          // 성공 메시지 설정
          setSuccessMessage('사용자가 성공적으로 삭제되었습니다.');

          // 3초 후 성공 메시지 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          // 서버에서 성공적으로 처리되지 않은 경우
          console.error('Failed to delete user on server.');
          alert('서버에서 사용자 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    },
    [siteId]
  );

  // Toggle Favorite
  const toggleFavorite = useCallback(
    (userId) => {
      // 업데이트할 사용자 찾기
      const userToUpdate = users.find((user) => user.id === userId);
      if (userToUpdate) {
        // 즐겨찾기 상태 토글
        const updatedUser = { ...userToUpdate, isFavorite: !userToUpdate.isFavorite };

        // 서버로 업데이트
        updateUser(updatedUser, true); // sendToServer를 true로 설정하여 서버로 전송

        // 로컬 상태 업데이트
        setUsers((prevUsers) => {
          const updatedUsers = prevUsers.map((user) =>
            user.id === userId ? updatedUser : user
          );
          // 로컬 스토리지 저장 부분 제거
          // saveToLocalStorage('users', updatedUsers);
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
          method: 'POST', // 관리자 정보 수정을 위한 명령 코드는 POST
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
              command: 7, // 관리자 정보 수정을 위한 명령 코드
              siteId: siteId, // 동적 siteId 추가
            },
            data: {
              AdminId: updatedAdminInfo.adminId,
              Password: updatedAdminInfo.password,
            },
          }),
        });

        const responseData = await response.json();

        if (response.ok && responseData.status !== 'ExistsId') {
          console.log('Admin info updated successfully:', responseData);
          saveToLocalStorage('adminInfo', updatedAdminInfo);
          setSuccessMessage('관리자 정보가 성공적으로 수정되었습니다.');

          // 3초 후 성공 메시지 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else if (responseData.status === 'ExistsId') {
          // 아이디 중복 오류 처리
          alert('아이디가 이미 존재합니다. 다른 아이디를 사용해주세요.');
        } else {
          console.error('Failed to update admin info:', responseData);
          alert('관리자 정보 수정에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error updating admin info:', error);
        alert('관리자 정보 수정 중 오류가 발생했습니다.');
      }
    },
    [siteId]
  );

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {isLoggedIn ? (
          <>
            {/* 성공 메시지 모달 */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
              {successMessage && (
                <div className="bg-green-500 text-white px-4 py-2 rounded shadow">
                  {successMessage}
                </div>
              )}
            </div>

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
            <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <Header setShowModal={setShowModal} setSearchQuery={setSearchQuery} />
                      <main className="p-4">
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
                        />
                      </main>
                    </>
                  }
                />
                <Route
                  path="/users/:userId"
                  element={<UserDetail users={users} updateUserLifeLog={updateUser} siteId={siteId}/>}
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      handleUpdateAdminInfo={handleUpdateAdminInfo}
                      users={users}
                      deleteUser={deleteUser}
                      siteId={siteId} // 동적 siteId 전달
                    />
                  }
                />
                {/* 기타 라우트 추가 */}
              </Routes>
            </div>
          </>
        ) : (
          <Login setIsLoggedIn={setIsLoggedIn} setSiteId={setSiteId} /> 
        )}
      </div>
    </Router>
  );
}

export default App;
