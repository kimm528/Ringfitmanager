import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserDetail from './components/UserDetail';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 사용자별로 랜덤 데이터를 생성하여 사용자 객체에 추가
  const generateUserData = () => ({
    bpm: Math.floor(Math.random() * 120) + 60, // 60~180 BPM 랜덤 생성
    oxygen: Math.floor(Math.random() * 5) + 95, // 95~100% 랜덤 생성
    stress: Math.floor(Math.random() * 100), // 0~100 스트레스 지수
    sleep: Math.floor(Math.random() * 100), // 0~100 수면 점수
    steps: Math.floor(Math.random() * 10000), // 0~10000 걸음수 랜덤 생성
    calories: Math.floor(Math.random() * 2000) + 500, // 500~2500 칼로리 랜덤 생성
    distance: (Math.random() * 8).toFixed(2), // 0~8km 이동거리 랜덤 생성
  });

  const [users, setUsers] = useState([
    {
      id: 1,
      name: '최영자',
      gender: '여',
      age: 65,
      profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
      isFavorite: false,
      data: generateUserData(),
    },
    {
      id: 2,
      name: '김철수',
      gender: '남',
      age: 70,
      profileImage: 'https://randomuser.me/api/portraits/men/70.jpg',
      isFavorite: false,
      data: generateUserData(),
    },
    // ... 다른 사용자들
  ]);

  // 새 사용자 추가 처리
  const handleAddUser = (newUser) => {
    setUsers((prevUsers) => [
      ...prevUsers,
      {
        ...newUser,
        id: prevUsers.length + 1,
        data: generateUserData(),
        isFavorite: false,
      },
    ]);
    setShowModal(false); // 모달 닫기
  };

  const updateUser = (updatedUser) => {
    // 목표 달성율 재계산
    const { data, goals } = updatedUser;
  
    const safeDivide = (numerator, denominator) =>
      denominator === 0 ? 0 : (numerator / denominator) * 100;
  
    const stepsPercentage = Math.min(safeDivide(data.steps, goals.stepsGoal), 100);
  const caloriesPercentage = Math.min(safeDivide(data.calories, goals.caloriesGoal), 100);
  const distancePercentage = Math.min(safeDivide(data.distance, goals.distanceGoal), 100);

    const achievementPercentage =
      (stepsPercentage + caloriesPercentage + distancePercentage) / 3;
  
    const userWithAchievement = {
      ...updatedUser,
      achievementPercentage,
    };
  
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? userWithAchievement : user
      )
    );
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {isLoggedIn ? (
          <>
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              users={users}
            />
            <div
              className={`flex-1 transition-all duration-300 overflow-y-auto ${
                isSidebarOpen ? 'ml-1' : 'ml-1'
              }`}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <Header
                        setShowModal={setShowModal}
                        setSearchQuery={setSearchQuery}
                      />
                      <main className="p-4">
                        <Dashboard
                          showModal={showModal}
                          setShowModal={setShowModal}
                          users={users}
                          setUsers={setUsers}
                          searchQuery={searchQuery}
                          handleAddUser={handleAddUser} // 사용자 추가 함수 전달
                          updateUser={updateUser} // 사용자 정보 업데이트 함수 전달
                        />
                      </main>
                    </>
                  }
                />
                <Route
                  path="/users/:userId"
                  element={<UserDetail users={users} />}
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
