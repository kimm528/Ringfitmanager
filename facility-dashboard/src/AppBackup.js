// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Components/Header';
import Sidebar from './Components/Sidebar';
import Dashboard from './Components/Dashboard';
import UserDetail from './Components/UserDetail';
import Login from './Components/Login';

// 기본 프로필 이미지 URL 설정
const defaultProfileImage = 'https://via.placeholder.com/150?text=No+Image';


// Helper functions for localStorage operations
const loadFromLocalStorage = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveToLocalStorage = (key, value) => {
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
  const [users, setUsers] = useState(loadFromLocalStorage('users', []));
  const [sortOption, setSortOption] = useState('name');
  const [availableRings, setAvailableRings] = useState([]); // 링 데이터를 저장할 상태 추가
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Users and Ring Data from API
  const fetchUsersAndRingData = useCallback(async () => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const userResponse = await axios.get(
        'https://fitlife.dotories.com/api/user?siteId=Dotories',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const userData = userResponse.data.Data;

      // Fetch Ring Data
      const currentDate = getCurrentYYMMDD();
      const ringUrl = `https://fitlife.dotories.com/api/ring?siteId=Dotories&yearMonthDay=${currentDate}`;

      const ringResponse = await axios.get(ringUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      const ringData = ringResponse.data.Data;
      setAvailableRings(ringData); // 링 데이터를 상태로 저장

      // Map Ring Data to Users
      const updatedUsers = userData.map((user) => {
        const userRingData = ringData.find((ring) => ring.MacAddr === user.MacAddr);
        return {
          id: user.Id,
          name: user.Name,
          gender: user.Gender,
          age: user.Age,
          profileImage: user.TitleImagePath || defaultProfileImage, // 기본 이미지 사용
          address: user.Address,
          stepTarget: user.StepTarget || 10000,
          kcalTarget: user.KcalTarget || 2000,
          kmTarget: user.KmTarget || 5,
          macAddr: user.MacAddr || '',
          albumPath: user.AlbumPath || [],
          lifeLogs: (user.LifeLogs || []).map((log, index) => ({
            id: index + 1,
            medicine: log.LogContent,
            date: log.LogDateTime.split('T')[0],
            time: log.LogDateTime.split('T')[1].substring(0, 5),
            dose: log.Description,
            taken: log.IsChecked,
          })),
          ring: userRingData || null,
          data: {
            bpm: user.BPM || 0,
            oxygen: user.Oxygen || 0,
            stress: user.Stress || 0,
            sleep: user.Sleep || 0,
            steps: user.Steps || 0,
            calories: user.Calories || 0,
            distance: user.Distance || 0,
            lineData: [],
            barData: [],
          },
        };
      });

      // Update state and localStorage
      setUsers(updatedUsers);
      saveToLocalStorage('users', updatedUsers);
    } catch (error) {
      console.error('Failed to fetch user or ring data:', error.response || error.message);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchUsersAndRingData();
  }, [fetchUsersAndRingData]);

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
              command: 5, // 사용자 추가를 위한 명령 코드
              siteId: 'Dotories',
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
            profileImage: newUser.profileImage || 'https://default-image-url.com/default.jpg',
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
          };
  
          setUsers((prevUsers) => {
            const updatedUsers = [...prevUsers, createdUser];
            saveToLocalStorage('users', updatedUsers);
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
    [users]
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
        const isDifferent = JSON.stringify(prevUsers) !== JSON.stringify(updatedUsers);
        if (isDifferent) {
          saveToLocalStorage('users', updatedUsers);
          return updatedUsers;
        }
        return prevUsers;
      });

      // 서버로 POST 요청을 보낼지 여부를 결정
      if (sendToServer) {
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
                command: 5, // 사용자 업데이트를 위한 명령 코드
                siteId: 'Dotories',
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
                LifeLogs: updatedUser.lifeLogs || [],
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
    [setUsers]
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
            siteId: 'Dotories',
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
          saveToLocalStorage('users', updatedUsers);
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
  [setUsers]
);



   // Toggle Favorite
   const toggleFavorite = useCallback((userId) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.id === userId ? { ...user, isFavorite: !user.isFavorite } : user
      );
      saveToLocalStorage('users', updatedUsers);
      return updatedUsers;
    });
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {isLoggedIn ? (
          <>
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
                          fetchUsers={fetchUsersAndRingData}
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
                  element={<UserDetail users={users} updateUserLifeLog={updateUser} />}
                />
              </Routes>
            </div>
          </>
        ) : (
          <Login setIsLoggedIn={setIsLoggedIn} />
        )}
      </div>
    </Router>
  );
}

export default App;
