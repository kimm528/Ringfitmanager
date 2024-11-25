// src/App.js

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import isEqual from 'lodash/isEqual'; // lodash의 isEqual 함수 임포트

import Header from './Components/Header.js';
import Sidebar from './Components/Sidebar';
import Dashboard from './Components/Dashboard';
import UserDetail from './Components/UserDetail';
import Login from './Components/Login';
import Settings from './Components/Settings';
import FloorPlan from './Components/FloorPlan';
import DeviceManagement from './Components/DeviceManagement';

// React.memo로 컴포넌트 래핑
const MemoizedSidebar = memo(Sidebar);
const MemoizedDashboard = memo(Dashboard);
const MemoizedUserDetail = memo(UserDetail);
const MemoizedSettings = memo(Settings);
const MemoizedFloorPlan = memo(FloorPlan);
const MemoizedDeviceManagement = memo(DeviceManagement);

const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
//const url = 'http://14.47.20.111:7201'
const url = 'https://fitlife.dotories.com'

// 세션 스토리지 관련 헬퍼 함수
const loadFromSessionStorage = (key, defaultValue) => {
  const stored = sessionStorage.getItem(key);
  if (!stored) return defaultValue;

  // JSON 파싱이 필요한 키 목록
  const jsonKeys = ['users', 'devices', 'floorPlanImage', 'availableRings', 'healthData'];

  if (jsonKeys.includes(key)) {
    try {
      const parsed = JSON.parse(stored);
      // 'users'의 경우, 배열인지 확인
      if (key === 'users') {
        return Array.isArray(parsed) ? parsed : defaultValue;
      }
      return parsed;
    } catch (error) {
      console.error(`Error parsing sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  } else {
    // 단순 문자열인 경우 그대로 반환
    return stored;
  }
};

const saveToSessionStorage = (key, value) => {
  if (typeof value === 'object') {
    sessionStorage.setItem(key, JSON.stringify(value));
  } else {
    sessionStorage.setItem(key, value);
  }
};

// Sidebar 상태를 경로에 따라 제어하는 컴포넌트
const SidebarController = ({ setIsSidebarOpen, children }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/floorplan') {
      setIsSidebarOpen(false);
      console.log('Sidebar 닫힘');
    }
    // /floorplan 외의 경로에서는 Sidebar 상태를 변경하지 않음
  }, [location.pathname, setIsSidebarOpen]);

  return children;
};

// 컴포넌트 외부로 함수 이동
const getLastNonZero = (arr) => {
  if (!arr || !Array.isArray(arr)) return 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== 0) {
      return arr[i];
    }
  }
  return 0; // Return 0 if all values are zero
};

// 컴포넌트 외부로 함수 이동
const formatDateYYMMDD = (date) => {
  const year = String(date.getFullYear()).slice(-2); // 마지막 두 자리
  const month = (`0${date.getMonth() + 1}`).slice(-2); // 월은 0부터 시작하므로 +1
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}${month}${day}`;
};

function App() {
  // 상태 변수들
  const [isLoggedIn, setIsLoggedIn] = useState(loadFromSessionStorage('isLoggedIn', false));
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(loadFromSessionStorage('users', []));
  const [sortOption, setSortOption] = useState('name');
  const [availableRings, setAvailableRings] = useState(loadFromSessionStorage('availableRings', [])); // 링 데이터를 초기 로드
  const [successMessage, setSuccessMessage] = useState('');
  const [disconnectInterval, setDisconnectInterval] = useState(5);
  const [siteId, setSiteId] = useState(loadFromSessionStorage('siteId', ''));
  const [floorPlanImage, setFloorPlanImage] = useState(loadFromSessionStorage('floorPlanImage', null));
  const [devices, setDevices] = useState(loadFromSessionStorage('devices', []));
  const [isLoading, setIsLoading] = useState(false); // isLoading 상태 추가

  // **잠금 상태를 App.js에서 관리하도록 추가**
  const [isLocked, setIsLocked] = useState(true); // 잠금 상태 추가

  // **건강 데이터 상태 관리 추가**
  const [healthData, setHealthData] = useState(() => loadFromSessionStorage('healthData', {}));

  // Ref for interval to prevent multiple intervals
  const intervalRef = useRef(null);

  // 건강 데이터 fetching 함수
  const fetchHealthData = useCallback(async (userId, date) => {
    if (!siteId) {
      console.warn('siteId가 설정되지 않았습니다.');
      return;
    }

    try {
      const formattedDate = formatDateYYMMDD(date); // YYMMDD 형식으로 변환
      const healthResponse = await axios.get(
        `${url}/api/user/health?siteId=${siteId}&userId=${userId}&yearMonthDay=${formattedDate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const healthJson = typeof healthResponse.data === 'string' ? JSON.parse(healthResponse.data) : healthResponse.data;
      const healthDataArray = healthJson.Data || [];

      // 특정 날짜의 데이터를 사용 (예: 최신 데이터)
      const latestHealthData = healthDataArray[healthDataArray.length - 1] || {};

      // 기존 데이터와 비교하여 변경된 경우에만 업데이트
      setHealthData((prevData) => {
        const key = `${userId}_${formattedDate}`;
        const existingData = prevData[key];
        if (!isEqual(existingData, latestHealthData)) {
          console.log(`건강 데이터가 변경되었습니다: 사용자 ${userId}, 날짜 ${formattedDate}`, latestHealthData);
          return {
            ...prevData,
            [key]: latestHealthData,
          };
        }
        return prevData; // 변경되지 않았으므로 상태 업데이트하지 않음
      });

      // 사용자 데이터 업데이트
      setUsers((prevUsers) =>
        prevUsers.map(user => {
          if (user.id === userId) {
            const newData = {
              ...user.data,
              bpm: getLastNonZero(latestHealthData.HeartRateArr),
              oxygen: getLastNonZero(latestHealthData.BloodOxygenArr),
              stress: getLastNonZero(latestHealthData.PressureArr), // 스트레스 지수가 API 응답에 없으므로 기본값 또는 다른 로직으로 설정
              sleep: latestHealthData.Sleep?.TotalSleepDuration || 0,
              steps: latestHealthData.Sport?.slice(-1)[0]?.TotalSteps || 0,
              calories: latestHealthData.Sport?.slice(-1)[0]?.Calorie || 0,
              distance: latestHealthData.Sport?.slice(-1)[0]?.WalkDistance || 0,
              heartRateArr: latestHealthData.HeartRateArr || [],
              pressureArr: latestHealthData.PressureArr || [],
              oxygenArr: latestHealthData.BloodOxygenArr || [],
              hourlyData: {
                steps: latestHealthData.Sport?.map(s => s.TotalSteps) || [],
                calories: latestHealthData.Sport?.map(s => s.Calorie) || [],
                distance: latestHealthData.Sport?.map(s => s.WalkDistance) || [],
              },
            };
            return { ...user, data: newData };
          }
          return user;
        })
      );

    } catch (healthError) {
      console.warn(`사용자 ${userId}의 건강 데이터 가져오기 실패:`, healthError.message);
      setHealthData((prevData) => ({
        ...prevData,
        [`${userId}_${formatDateYYMMDD(date)}`]: {}
      }));
    }
  }, [siteId, url, credentials]);

  // 사용자 및 링 데이터 가져오기 함수 (건강 데이터 fetching 제거)
  const fetchUsersAndRingData = useCallback(async () => {
    if (!siteId) {
      console.warn('siteId가 설정되지 않았습니다.');
      return;
    }
  
    try {
      const userResponse = await axios.get(
        `${url}/api/user?siteId=${siteId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );
  
      const jsonData = typeof userResponse.data === 'string' ? JSON.parse(userResponse.data) : userResponse.data;
      const userData = jsonData.Data || [];
  
      // 링 데이터 가져오기
      const ringUrl = `${url}/api/ring?siteId=${siteId}`;
  
      let ringData = [];
      try {
        const ringResponse = await axios.get(ringUrl, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        });
  
        const jsonRing = typeof ringResponse.data === 'string' ? JSON.parse(ringResponse.data) : ringResponse.data;
        ringData = jsonRing.Data || [];
      } catch (ringError) {
        console.warn('링 데이터 가져오기 실패:', ringError.message);
        ringData = [];
      }
  
      // 링 데이터를 상태에 저장하고 세션 스토리지에 저장
      setAvailableRings(ringData);
      saveToSessionStorage('availableRings', ringData);
  
      const ringMap = new Map();
      ringData.forEach(ring => {
        ringMap.set(ring.MacAddr, ring);
      });
  
      const updatedUsers = userData.map((user) => {
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
  
        // 사용자와 링 연결
        const userRing = ringMap.get(user.MacAddr) || {}; // 변경: null 대신 빈 객체로 설정
  
        return {
          id: user.Id,
          name: user.Name,
          gender: user.Gender,
          age: user.Age,
          address: user.Address,
          stepTarget: user.StepTarget || 10000,
          kcalTarget: user.KcalTarget || 2000,
          kmTarget: user.KmTarget || 5,
          macAddr: user.MacAddr || '',
          lifeLogs: lifeLogs,
          ring: userRing, // 링 데이터 연결 (null 대신 객체)
          isFavorite: user.Favorite || false,
          data: {
            bpm: 0,
            oxygen: 0,
            stress: 0,
            sleep: 0,
            steps: 0,
            calories: 0,
            distance: 0,
            heartRateArr: [],
            pressureArr: [],
            oxygenArr: [],
            hourlyData: {
              steps: [],
              calories: [],
              distance: [],
            },
          },
          thresholds: {
            heartRateWarningLow: user.WarningHeartRate ? user.WarningHeartRate[0] : 80,
            heartRateWarningHigh: user.WarningHeartRate ? user.WarningHeartRate[1] : 120,
            heartRateDangerLow: user.DangersHeartRate ? user.DangersHeartRate[0] : 70,
            heartRateDangerHigh: user.DangersHeartRate ? user.DangersHeartRate[1] : 140,
          },
        };
      });
  
      // **변경 감지 및 상태 업데이트**
      setUsers((prevUsers) => {
        const prevUsersMap = new Map(prevUsers.map(user => [user.id, user]));
        const changedUsers = [];
      
        const mergedUsers = updatedUsers.map(user => {
          const prevUser = prevUsersMap.get(user.id);
          if (!prevUser) {
            // 새로운 사용자
            changedUsers.push(user);
            return user;
          }
      
          // connectedTime을 제외한 사용자 데이터 비교
          const { ring: prevRing = {}, ...prevUserRest } = prevUser;
          const { ring: newRing = {}, ...newUserRest } = user;
      
          // connectedTime을 제외한 링 데이터 비교 (ring은 항상 객체)
          const { ConnectedTime: _, ...prevRingRest } = prevRing;
          const { ConnectedTime: __, ...newRingRest } = newRing;
      
          if (!isEqual(prevUserRest, newUserRest) || !isEqual(prevRingRest, newRingRest)) {
            changedUsers.push(user);
            return user;
          }
      
          return prevUser; // 동일한 객체 참조 유지
        });
      
        if (changedUsers.length > 0) {
          console.log('변경된 사용자 데이터가 있습니다:', changedUsers);
          return mergedUsers;
        } else {
          console.log('사용자 데이터에 변경 사항이 없습니다.');
          return prevUsers;
        }
      });
  
      saveToSessionStorage('users', updatedUsers); // 세션 스토리지에 저장
      console.log('서버에서 사용자 데이터 가져오기 및 저장');
  
      // 각 사용자에 대해 건강 데이터 가져오기
      updatedUsers.forEach(user => {
        const today = new Date(); // 오늘 날짜로 설정
        fetchHealthData(user.id, today);
      });
  
    } catch (error) {
      console.error('사용자 데이터 가져오기 실패:', error.response || error.message);
    }
  }, [siteId, credentials, url, fetchHealthData, isEqual]);

  // 배치도 이미지 및 디바이스 데이터 가져오기 함수
  const handleLoadFloorPlan = useCallback(async () => {
    if (!siteId) {
      console.warn('siteId가 설정되지 않았습니다.');
      return;
    }
    setIsLoading(true);
    try {
      // 배치도 이미지 세션 스토리지에서 로드 시도
      const cachedImageData = loadFromSessionStorage(`floorPlanImage_${siteId}`, null);
      if (cachedImageData) {
        const img = new Image();
        img.onload = () => {
          setFloorPlanImage(img);
          // 캔버스 크기 조정은 FloorPlan 컴포넌트에서 처리
        };
        img.src = cachedImageData;
        console.log('배치도 이미지 로드 성공 (세션에서 불러옴)');
      } else {
        // 서버에서 배치도 이미지 가져오기
        const imageResponse = await axios.get(`${url}/api/site/image?siteId=${siteId}`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          responseType: 'blob', // 이미지 데이터 타입 설정
        });

        if (imageResponse.status === 200) {
          const blob = imageResponse.data;
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            saveToSessionStorage(`floorPlanImage_${siteId}`, base64data); // 세션 스토리지에 저장
            const img = new Image();
            img.onload = () => {
              setFloorPlanImage(img);
              // 캔버스 크기 조정은 FloorPlan 컴포넌트에서 처리
            };
            img.src = base64data;
          };
          reader.readAsDataURL(blob);
          console.log('배치도 이미지 로드 성공 (서버에서 불러옴)');
        } else {
          console.error('배치도 이미지 로드 실패:', imageResponse.statusText);
        }
      }

      // 스마트폰 위치 데이터 불러오기
      const deviceResponse = await axios.get(`${url}/api/device?siteId=${siteId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });

      if (deviceResponse.status === 200) {
        const parsedDeviceData = typeof deviceResponse.data === 'string' ? JSON.parse(deviceResponse.data) : deviceResponse.data;
        const fetchedDevices = parsedDeviceData.Data || [];
        setDevices(fetchedDevices);
        saveToSessionStorage('devices', fetchedDevices); // 세션 스토리지에 저장
        console.log('스마트폰 위치 데이터 불러오기 성공:', fetchedDevices);
      } else {
        console.error('스마트폰 위치 데이터 불러오기 실패:', deviceResponse.statusText);
        setDevices([]); // 오류 발생 시 devices 상태를 빈 배열로 설정
        saveToSessionStorage('devices', []); // 빈 배열 저장
      }
    } catch (error) {
      console.error('스마트폰 위치 데이터 불러오기 오류:', error);
      setDevices([]); // 오류 발생 시 devices 상태를 빈 배열로 설정
      saveToSessionStorage('devices', []); // 빈 배열 저장
    } finally {
      setIsLoading(false);
    }
  }, [siteId, credentials, url]);

  // 주기적인 데이터 업데이트 (30초마다)
  useEffect(() => {
    if (!isLoggedIn || !siteId || !isLocked) return; // 조건에 따라 새로고침 중지
   
    // 초기 데이터 로드
    fetchUsersAndRingData();
    handleLoadFloorPlan();

    // 인터벌 설정 전에 기존 인터벌이 있는지 확인
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      console.log('30초마다 사용자 및 링 데이터 가져오기');
      fetchUsersAndRingData();
      handleLoadFloorPlan();
    }, 30000); // 30초

    console.log('인터벌이 설정되었습니다.');

    return () => {
      clearInterval(intervalRef.current);
      console.log('인터벌이 정리되었습니다.');
    };
  }, [fetchUsersAndRingData, handleLoadFloorPlan, isLoggedIn, siteId, isLocked]);

  // 사용자 데이터 변경 시 세션 스토리지에 저장
  useEffect(() => {
    saveToSessionStorage('users', users);
  }, [users]);

  // 건강 데이터 변경 시 세션 스토리지에 저장
  useEffect(() => {
    saveToSessionStorage('healthData', healthData);
  }, [healthData]);

  // 사이트 ID 변경 시 세션 스토리지에 저장
  useEffect(() => {
    saveToSessionStorage('siteId', siteId);
  }, [siteId]);

  // 디바이스 데이터 변경 시 세션 스토리지에 저장
  useEffect(() => {
    saveToSessionStorage('devices', devices);
  }, [devices]);

  // 배치도 이미지 변경 시 세션 스토리지에 저장
  useEffect(() => {
    if (floorPlanImage && floorPlanImage.src) {
      saveToSessionStorage(`floorPlanImage_${siteId}`, floorPlanImage.src);
    }
  }, [floorPlanImage, siteId]);

  useEffect(() => {
    saveToSessionStorage('availableRings', availableRings);
  }, [availableRings]);

  // 초기 데이터 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    if (isLoggedIn && siteId) {
      const storedUsers = loadFromSessionStorage('users', []);
      if (storedUsers.length > 0) {
        setUsers(storedUsers);
        console.log('초기 로드 시 세션 스토리지에서 사용자 데이터 로드');

        // 각 사용자에 대해 건강 데이터 가져오기
        storedUsers.forEach(user => {
          const today = new Date(); // 오늘 날짜로 설정
          fetchHealthData(user.id, today);
        });

      } else {
        setUsers([]); // 이전 사용자 데이터 초기화
        fetchUsersAndRingData(); // 새로운 데이터 가져오기
        handleLoadFloorPlan(); // 배치도 및 디바이스 데이터 가져오기
      }

      // availableRings 로드
      const storedRings = loadFromSessionStorage('availableRings', []);
      if (storedRings.length > 0) {
        setAvailableRings(storedRings);
        console.log('초기 로드 시 세션 스토리지에서 링 데이터 로드');
      }
    }
  }, [isLoggedIn, siteId, fetchUsersAndRingData, handleLoadFloorPlan, fetchHealthData]);

  // 새로운 ID 생성 함수
  const getNewId = useCallback((users) => {
    const existingIds = users.map((user) => user.id).sort((a, b) => a - b);
    let newId = 1;

    for (let i = 0; i < existingIds.length; i++) {
      if (existingIds[i] !== newId) {
        break;
      }
      newId++;
    }
    return newId;
  }, []);

  // 사용자 추가 함수
  const handleAddUser = useCallback(
    async (newUser) => {
      if (!siteId) {
        alert('사이트 ID가 설정되지 않았습니다.');
        return;
      }

      try {
        const apiUrl = `${url}/api/user`;
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
              siteId: siteId,
            },
            data: {
              Id: newId,
              Gender: gender,
              Name: newUser.name,
              Age: newUser.age,
              Address: newUser.address || '',
              StepTarget: newUser.stepTarget || 10000,
              KcalTarget: newUser.kcalTarget || 2000,
              KmTarget: newUser.kmTarget || 5,
              MacAddr: newUser.macAddr || '',
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
            address: newUser.address || '',
            stepTarget: newUser.stepTarget || 10000,
            kcalTarget: newUser.kcalTarget || 2000,
            kmTarget: newUser.kmTarget || 5,
            macAddr: newUser.macAddr || '',
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
              heartRateArr: [],
              pressureArr: [],
              oxygenArr: [],
              hourlyData: {
                steps: [],
                calories: [],
                distance: [],
              },
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
          // 세션 스토리지는 useEffect를 통해 자동 저장

          setShowModal(false);

          // 성공 메시지 설정
          setSuccessMessage('사용자가 추가되었습니다.');

          // 3초 후 메시지 자동 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);

          // 새로 추가된 사용자에 대해 건강 데이터 가져오기
          const today = new Date();
          fetchHealthData(newId, today);

        } else {
          console.error('서버에 사용자 추가 실패:', responseText);
          alert('서버에 사용자를 추가하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 추가 오류:', error);
        alert('사용자 추가 중 오류가 발생했습니다.');
      }
    },
    [users, siteId, credentials, fetchHealthData, getNewId, url]
  );

  // 사용자 업데이트 함수
  const updateUser = useCallback(
    async (updatedUser, sendToServer = false) => {
      console.log('사용자 업데이트:', updatedUser);

      // 기존 사용자 데이터와 비교하여 변경된 경우에만 상태 업데이트
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((u) => {
          if (u.id === updatedUser.id) {
            // 변경된 부분이 있는지 확인
            const isDifferent = !isEqual(u, updatedUser);
            if (isDifferent) {
              return { ...u, ...updatedUser };
            }
          }
          return u;
        });
        return updatedUsers;
      });

      // 서버에 업데이트 요청
      if (sendToServer && siteId) {
        try {
          const apiUrl = `${url}/api/user`;
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
                siteId: siteId,
              },
              data: {
                Id: updatedUser.id,
                Gender: gender,
                Name: updatedUser.name,
                Age: updatedUser.age,
                StepTarget: updatedUser.stepTarget || 10000,
                KcalTarget: updatedUser.kcalTarget || 2000,
                KmTarget: updatedUser.kmTarget || 5,
                MacAddr: updatedUser.macAddr || '',
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
    [siteId, credentials, url, isEqual]
  );

  // 사용자 삭제 함수
  const deleteUser = useCallback(
    async (userId) => {
      console.log('사용자 삭제 ID:', userId);

      try {
        const apiUrl = `${url}/api/user`;

        const response = await fetch(`${apiUrl}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
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
    [siteId, credentials, url]
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
        const apiUrl = `${url}/api/admin`; // 관리자 정보 수정 API 엔드포인트

        const response = await fetch(apiUrl, {
          method: 'POST', // 관리자 정보 수정을 위한 POST 메서드
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            header: {
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
          saveToSessionStorage('adminInfo', updatedAdminInfo);
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
    [siteId, credentials, url]
  );

  return (
    <Router>
      {isLoggedIn ? (
        <SidebarController setIsSidebarOpen={setIsSidebarOpen}>
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
              <MemoizedSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                setIsLoggedIn={setIsLoggedIn}
                sortOption={sortOption}
                setSortOption={setSortOption}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                siteId={siteId}
                users={users} // props로 전달
                devices={devices} // props로 전달 (필요 시)
                // ... 기타 props
              />
              <div className="flex-1 overflow-y-auto flex flex-col">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <Header setShowModal={setShowModal} setSearchQuery={setSearchQuery} />
                        <main className="p-4 flex-1">
                          <MemoizedDashboard
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
                            // updateKey={updateKey} // updateKey 제거
                            devices={devices} // props로 전달
                          />
                        </main>
                      </>
                    }
                  />
                  {/* 수정된 Route: UserDetail에 fetchHealthData와 healthData 전달 */}
                  <Route
                    path="/users/:userId"
                    element={
                      <MemoizedUserDetail
                        users={users}
                        updateUserLifeLog={updateUser}
                        siteId={siteId}
                        fetchHealthData={fetchHealthData} // 추가
                        healthData={healthData} // 추가
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <MemoizedSettings
                        handleUpdateAdminInfo={handleUpdateAdminInfo}
                        users={users}
                        deleteUser={deleteUser}
                        siteId={siteId}
                        disconnectInterval={disconnectInterval}
                        setDisconnectInterval={setDisconnectInterval}
                        devices={devices} // props로 전달
                      />
                    }
                  />
                  <Route
                    path="/floorplan"
                    element={
                      <MemoizedFloorPlan
                        ringData={availableRings}
                        users={users}
                        floorPlanImage={floorPlanImage}
                        devices={devices}
                        setDevices={setDevices}
                        setFloorPlanImage={setFloorPlanImage}
                        siteId={siteId}
                        // updateKey={updateKey} // updateKey 제거
                        isLocked={isLocked}
                        setIsLocked={setIsLocked}
                      />
                    }
                  />
                  <Route
                    path="/devices"
                    element={
                      <MemoizedDeviceManagement
                        users={users}
                        setUsers={setUsers}
                        siteId={siteId}
                        fetchUsers={fetchUsersAndRingData}
                        availableRings={availableRings}
                      />
                    }
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
