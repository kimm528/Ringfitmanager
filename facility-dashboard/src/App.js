import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
  

  
  // 사용자 데이터를 서버에서 가져오는 함수
  const fetchUsers = async () => {
    try {
      const credentials = btoa(`${'Dotories'}:${'DotoriesAuthorization0312983335'}`);  // 필요한 인증 정보 인코딩
      const response = await axios.get(
        'https://dotoriesringcloudserver.azurewebsites.net/api/user?siteId=Dotories',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`  // 인증 정보 포함
          }
        }
      );
      
      console.log('서버 응답 데이터:', response.data);

    const data = response.data.Data; 

    const fetchedUsers = data.map(user => ({
      id: user.Id,
      name: user.Name,
      gender: user.Gender,
      age: user.Age,
      profileImage: user.TitleImagePath || 'https://default-image-url.com/default.jpg',
      address: user.Address,
      stepTarget: user.StepTarget,
      kcalTarget: user.KcalTarget,
      kmTarget: user.KmTarget,
      macAddr: user.MacAddr,
      albumPath: user.AlbumPath || [],
      lifeLogs: user.LifeLogs || [],
    }));
    
 // 상태 업데이트 (React State에 저장)
 setUsers((prevUsers) => {
  const existingIds = new Set(prevUsers.map(user => user.id));
  const newUsers = fetchedUsers.filter(user => !existingIds.has(user.id));
  return [...prevUsers, ...newUsers];
});
} catch (error) {
console.error('사용자 데이터를 가져오는 데 실패했습니다:', error.response || error.message);
setUsers([]);  // 에러 발생 시 빈 배열 설정
}
};

useEffect(() => {
  if (isLoggedIn) {
    fetchUsers(); // 로그인 상태일 때만 사용자 데이터를 가져옴
  }
}, [isLoggedIn]);

 

  // 랜덤 데이터 생성 함수들 (서버에서 데이터를 가져오므로 초기 랜덤 데이터는 필요 없을 수 있습니다)
  const generateLineData = () => {
    return Array.from({ length: 30 }, (_, index) => ({
      date: String(index + 1),
      bpm: Math.floor(Math.random() * 120) + 60,
      oxygen: Math.floor(Math.random() * 5) + 95,
      stress: Math.floor(Math.random() * 100),
      sleep: Math.floor(Math.random() * 100),
    }));
  };

  const generateBarData = () => {
    return Array.from({ length: 30 }, (_, index) => ({
      date: String(index + 1),
      steps: Math.floor(Math.random() * 10000),
      calories: Math.floor(Math.random() * 2000) + 500,
      distance: (Math.random() * 8).toFixed(2), // 0~8km 이동거리 랜덤 생성
    }));
  };

  // 사용자별로 랜덤 데이터를 생성하여 사용자 객체에 추가 (서버에서 데이터를 가져오므로 필요 없을 수 있음)
  const generateUserData = () => ({
    bpm: Math.floor(Math.random() * 120) + 60, // 60~180 BPM 랜덤 생성
    oxygen: Math.floor(Math.random() * 5) + 95, // 95~100% 랜덤 생성
    stress: Math.floor(Math.random() * 100), // 0~100 스트레스 지수
    sleep: Math.floor(Math.random() * 100), // 0~100 수면 점수
    steps: Math.floor(Math.random() * 10000), // 0~10000 걸음수 랜덤 생성
    calories: Math.floor(Math.random() * 2000) + 500, // 500~2500 칼로리 랜덤 생성
    distance: (Math.random() * 8).toFixed(2), // 0~8km 이동거리 랜덤 생성
    lineData: generateLineData(), // 사용자별 라인 차트 데이터
    barData: generateBarData(),   // 사용자별 바 차트 데이터
  });

  // 초기 사용자 데이터 (서버에서 데이터를 가져오므로 필요 없을 수 있음)
  const initialUsers = useMemo(
    () => [
      {
        id: 1,
        name: '최영자',
        gender: '여',
        age: 65,
        profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
        isFavorite: false,
        data: generateUserData(),
        lifeLog: [],
        goals: {
          stepsGoal: 10000,
          caloriesGoal: 2000,
          distanceGoal: 5,
        },
      },
      {
        id: 2,
        name: '김철수',
        gender: '남',
        age: 70,
        profileImage: 'https://randomuser.me/api/portraits/men/70.jpg',
        isFavorite: false,
        data: generateUserData(),
        lifeLog: [],
        goals: {
          stepsGoal: 10000,
          caloriesGoal: 2000,
          distanceGoal: 5,
        },
      },
      // ... 다른 사용자들
    ],
    []
  );

  // 상태 초기화: 서버에서 데이터를 가져오지 못했을 때 초기 사용자 데이터를 사용하도록 설정
  const [users, setUsers] = useState(initialUsers);

  // 새 사용자 추가 처리
  const handleAddUser = (newUser) => {
    // 나중에 서버에 사용자 추가 요청을 보낼 때, 여기서 POST 요청을 추가하면 됩니다.
    setUsers((prevUsers) => [
      ...prevUsers,
      {
        ...newUser,
        id: prevUsers.length + 1,
        data: generateUserData(),
        isFavorite: false,
        goals: {
          stepsGoal: 10000,
          caloriesGoal: 2000,
          distanceGoal: 5,
        },
      },
    ]);
    setShowModal(false); // 모달 닫기
  };

  // Life 로그 업데이트 처리 함수
  const updateUserLifeLog = (userId, newLifeLog) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, lifeLog: newLifeLog } : user
      )
    );
  };

  // 사용자 업데이트 처리
  const updateUser = (updatedUser) => {
    const defaultGoals = {
      stepsGoal: 10000,   // 기본 걸음수 목표
      caloriesGoal: 2000, // 기본 칼로리 목표
      distanceGoal: 5,    // 기본 이동거리 목표
    };

    const updatedGoals = updatedUser.goals ? updatedUser.goals : defaultGoals;

    const { data, goals = updatedGoals } = updatedUser;

    const safeDivide = (numerator, denominator) =>
      denominator === 0 ? 0 : (numerator / denominator) * 100;

    const stepsPercentage = Math.min(safeDivide(data.steps, goals.stepsGoal), 100);
    const caloriesPercentage = Math.min(safeDivide(data.calories, goals.caloriesGoal), 100);
    const distancePercentage = Math.min(safeDivide(data.distance, goals.distanceGoal), 100);

    const achievementPercentage = (stepsPercentage + caloriesPercentage + distancePercentage) / 3;

    const userWithAchievement = {
      ...updatedUser,
      achievementPercentage,
      goals: updatedGoals, // 업데이트된 goals 정보 포함
    };

    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? userWithAchievement : user))
    );
  };

  // 사용자 삭제 처리 함수
  const deleteUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
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
              className="hidden md:block"  // 데스크탑에서는 사이드바 표시
            />
            <div className="flex-1 overflow-y-auto">
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
                          users={users}  // 사용자 데이터를 Dashboard로 전달
                          setUsers={setUsers}
                          searchQuery={searchQuery}
                          handleAddUser={handleAddUser}  // 사용자 추가 함수 전달
                          updateUser={updateUser}  // 사용자 정보 업데이트 함수 전달
                          deleteUser={deleteUser}  // 사용자 삭제 함수 전달
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
                      updateUserLifeLog={updateUserLifeLog}
                    />
                  }
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