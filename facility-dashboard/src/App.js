// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDetail from './components/UserDetail';
import Login from './components/Login';

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
          profileImage: user.TitleImagePath || 'https://default-image-url.com/default.jpg',
          address: user.Address,
          stepTarget: user.StepTarget || 10000,
          kcalTarget: user.KcalTarget || 2000,
          kmTarget: user.KmTarget || 5,
          macAddr: user.MacAddr,
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

  // Add User Handler
  const handleAddUser = useCallback((newUser) => {
    setUsers((prevUsers) => {
      const existingIds = prevUsers.map((user) => user.id);
      const getNextId = () => {
        for (let i = 1; i <= prevUsers.length + 1; i++) {
          if (!existingIds.includes(i)) {
            return i;
          }
        }
        return Math.max(...existingIds) + 1;
      };

      const newId = getNextId();

      const updatedUsers = [
        ...prevUsers,
        {
          ...newUser,
          id: newId,
          isFavorite: false,
          goals: {
            stepsGoal: 10000,
            caloriesGoal: 2000,
            distanceGoal: 5,
          },
          data: {
            bpm: 0,
            oxygen: 0,
            stress: 0,
            sleep: 0,
            steps: 0,
            distance: 0,
            lineData: [],
            barData: [],
          },
          lifeLogs: [],
          ring: null,
        },
      ];
      saveToLocalStorage('users', updatedUsers);
      return updatedUsers;
    });
    setShowModal(false);
  }, []);

  // Update User Handler
  const updateUser = useCallback((updatedUser) => {
    console.log('Updating user:', updatedUser);
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
  }, []);

  // Delete User Handler
  const deleteUser = useCallback((userId) => {
    console.log('Deleting user with ID:', userId);
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter((user) => user.id !== userId);
      saveToLocalStorage('users', updatedUsers);
      return updatedUsers;
    });
  }, []);

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
                          availableRings={availableRings} // availableRings를 Dashboard에 전달
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
