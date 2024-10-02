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

// Move getCurrentYYMMDD outside the App component to ensure stable reference
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
  const [availableRings, setAvailableRings] = useState(loadFromLocalStorage('availableRings', []));
  const [sortOption, setSortOption] = useState('name'); // 기본값 'name'으로 설정

  // Fetch Users from API
  const fetchUsers = useCallback(async () => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const response = await axios.get(
        'https://fitlife.dotories.com/api/user?siteId=Dotories',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const data = response.data.Data;

      const fetchedUsers = data.map((user) => ({
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
        ring: null,
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
      }));

      // Automatically assign rings to users based on MacAddr
      const updatedUsersWithRings = fetchedUsers.map((user) => {
        if (!user.ring && user.macAddr) {
          const matchingRing = availableRings.find(
            (ring) => ring.MacAddr === user.macAddr
          );

          if (matchingRing) {
            // Assuming matchingRing contains steps, calories, distance
            return {
              ...user,
              ring: matchingRing,
              data: {
                ...user.data,
                steps: matchingRing.Steps || user.data.steps,
                calories: matchingRing.Calories || user.data.calories,
                distance: matchingRing.Distance || user.data.distance,
              },
            };
          }
        }
        return user;
      });

      // Update state and localStorage if data has changed
      setUsers((prevUsers) => {
        const isDifferent = JSON.stringify(prevUsers) !== JSON.stringify(updatedUsersWithRings);
        if (isDifferent) {
          saveToLocalStorage('users', updatedUsersWithRings);
          return updatedUsersWithRings;
        }
        return prevUsers;
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error.response || error.message);
    }
  }, [availableRings]);

  // Fetch Ring Data from API
  const fetchRingData = useCallback(async () => {
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const currentDate = getCurrentYYMMDD();
      const ringUrl = `https://fitlife.dotories.com/api/ring?siteId=Dotories&yearMonthDay=${currentDate}`;

      const response = await axios.get(ringUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        }
      });

      if (response.status !== 200) {
        throw new Error(`API response error: ${response.status}`);
      }

      const data = response.data.Data;
      if (!data) {
        throw new Error('No data received.');
      }

      // Prevent duplicate entries
      setAvailableRings((prevRings) => {
        const isDifferent = JSON.stringify(prevRings) !== JSON.stringify(data);
        if (isDifferent) {
          saveToLocalStorage('availableRings', data);
          return data;
        }
        return prevRings;
      });
    } catch (error) {
      console.error('Failed to fetch ring data:', error);
    }
  }, []);

  // Initial Load and Date Check
  useEffect(() => {
    const todayYYMMDD = getCurrentYYMMDD();
    const storedDate = localStorage.getItem('lastFetchedDate');

    if (storedDate !== todayYYMMDD) {
      setUsers([]);
      setAvailableRings([]);
      fetchUsers();
      fetchRingData();
      localStorage.setItem('lastFetchedDate', todayYYMMDD);
    }
  }, [fetchUsers, fetchRingData]);

  // Remove the periodic fetching useEffect from App.js
  // Instead, handle periodic fetching in Dashboard.js

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
      const updatedUsers = prevUsers.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
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
      const userToDelete = prevUsers.find((user) => user.id === userId);
      if (userToDelete && userToDelete.ring) {
        setAvailableRings((prevRings) => [...prevRings, userToDelete.ring]);
      }
      const updatedUsers = prevUsers.filter((user) => user.id !== userId);
      saveToLocalStorage('users', updatedUsers);
      return updatedUsers;
    });
  }, []);

  // Assign Ring to User Handler
  const assignRingToUser = useCallback((userId, ring) => {
    console.log(`Assigning ring ${ring.MacAddr} to user ${userId}`);
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            ring: ring,
            data: {
              ...user.data,
              steps: ring.Steps || user.data.steps,
              calories: ring.Calories || user.data.calories,
              distance: ring.Distance || user.data.distance,
            },
          };
        }
        return user;
      });
      saveToLocalStorage('users', updatedUsers);
      return updatedUsers;
    });
    setAvailableRings((prevRings) => {
      const updatedRings = prevRings.filter((r) => r.MacAddr !== ring.MacAddr);
      saveToLocalStorage('availableRings', updatedRings);
      return updatedRings;
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
                          availableRings={availableRings}
                          assignRingToUser={assignRingToUser}
                          fetchUsers={fetchUsers}
                          fetchRingData={fetchRingData}
                          sortOption={sortOption}
                          setSortOption={setSortOption}
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
