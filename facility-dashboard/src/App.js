// src/App.js

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import { produce } from 'immer'; // 명명된 임포트
import Cookies from 'js-cookie'; // js-cookie 임포트
import './index.css'; // 반드시 임포트되어야 합니다.

// 컴포넌트 임포트
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Dashboard from './components/Dashboard.js';
import UserDetail from './components/UserDetail.js';
import Login from './components/Login.js';
import Settings from './components/Settings.js';
import FloorPlan from './components/FloorPlan.js';
import DeviceManagement from './components/DeviceManagement.js';
import DataGridView from './components/DataGridView.js';
import Modal from './components/Modal.js';

// React.memo로 컴포넌트 래핑
const MemoizedSidebar = memo(Sidebar);
const MemoizedDashboard = memo(Dashboard);
const MemoizedUserDetail = memo(UserDetail);
const MemoizedSettings = memo(Settings);
const MemoizedFloorPlan = memo(FloorPlan);
const MemoizedDeviceManagement = memo(DeviceManagement);

const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
//const url = 'http://14.47.20.111:7201'
const url = 'https://fitlife.dotories.com';

// 세션 스토리지 관련 헬퍼 함수 (floorPlanImage만 처리하도록 수정)
const loadFromSessionStorage = (key, defaultValue) => {
  if (key !== `floorPlanImage_${Cookies.get('siteId')}`) { // siteId 기반으로 변경
    return defaultValue;
  }

  const stored = sessionStorage.getItem(key);
  if (!stored) return defaultValue;

  try {
    const parsed = stored; 
    return parsed;
  } catch (error) {
    console.error(`Error parsing sessionStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToSessionStorage = (key, value) => {
  if (key !== `floorPlanImage_${Cookies.get('siteId')}`) return; // floorPlanImage만 저장

  if (typeof value === 'object') {
    sessionStorage.setItem(key, JSON.stringify(value));
  } else {
    sessionStorage.setItem(key, value);
  }
};

// Sidebar 상태를 로에 따라 제어하는 컴포넌트
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

// Helper 함수들
const getLastNonZero = (arr) => {
  if (!arr || !Array.isArray(arr)) return 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== 0) {
      return arr[i];
    }
  }
  return 0; // 모든 값이 0인 경우
};

const formatDateYYMMDD = (date) => {
  const year = String(date.getFullYear()).slice(-2); // 마지막 두 자리
  const month = (`0${date.getMonth() + 1}`).slice(-2); // 월 (0부터 시작하므로 +1)
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}${month}${day}`;
};

function App() {
  // 상태 변수들
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // 모바일 환경인 경우 기본값 false, 데스크톱인 경우 true
    return window.innerWidth > 768;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [sortOption, setSortOption] = useState('이름 순');
  const [availableRings, setAvailableRings] = useState([]); // sessionStorage에서 로드하지 않음
  const [successMessage, setSuccessMessage] = useState('');
  const [disconnectInterval, setDisconnectInterval] = useState(5);
  const [siteId, setSiteId] = useState(''); // sessionStorage에서 로드하지 않음
  const [floorPlanImage, setFloorPlanImage] = useState(null); // floorPlanImage는 별도로 관리
  const [devices, setDevices] = useState([]); // sessionStorage에서 로드하지 않음
  const [isLoading, setIsLoading] = useState(false); // isLoading 상태 추가
  const [activeComponent, setActiveComponent] = useState(''); // activeComponent 상태 추가

  // 잠금 상태를 App.js에서 관리하도록 추가
  const [isLocked, setIsLocked] = useState(true); // 잠금 상태 추가

  // 건강 데이터 상태 관리 추가
  const [healthData, setHealthData] = useState({}); // sessionStorage에서 로드하지 않음

  // 현재 경로 상태
  const [currentPath, setCurrentPath] = useState('/');

  // Ref for interval to prevent multiple intervals
  const intervalRef = useRef(null);

  // PathListener 컴포넌트 정의: 현재 경로를 App의 상태로 전달
  const PathListener = React.memo(({ setCurrentPath }) => {
    const location = useLocation();
    useEffect(() => {
      setCurrentPath(location.pathname);
    }, [location.pathname, setCurrentPath]);

    return null;
  });

  // 로그인 상태 초기화: 컴포넌트 마운트 시 쿠키에서 값을 읽어와 상태 설정
  useEffect(() => {
    const loggedIn = Cookies.get('isLoggedIn') === 'true';
    const storedSiteId = Cookies.get('siteId') || '';

    setIsLoggedIn(loggedIn);
    setSiteId(storedSiteId);
    // adminId가 필요하면 추가로 상태에 저장
    // 예: setAdminId(storedAdminId);
  }, []);

  const getRandomTemperature = useCallback(() => {
    // 체온 범위: 34.8°C ~ 38.2°C
    return parseFloat((Math.random() * (38.2 - 34.8) + 34.8).toFixed(1));
  }, []);

  // 랜덤 혈압 생성 함수
  const getRandomBloodPressure = useCallback(() => {
    // 혈압 범위: 수축기 88~142 mmHg, 이완기 58~92 mmHg
    const systolic = Math.floor(Math.random() * (142 - 88 + 1) + 88); // 88 ~ 142 mmHg
    const diastolic = Math.floor(Math.random() * (92 - 58 + 1) + 58); // 58 ~ 92 mmHg
    return { systolic, diastolic };
  }, []);

  // 건강 데이터 fetching 함수
  const fetchHealthData = useCallback(async (userId, date) => {
    if (!siteId) {
      console.warn('siteId가 설정되지 않았습니다.');
      return;
    }

    try {
      const formattedDate = formatDateYYMMDD(date); // YYMMDD 형식으로 변환
      const healthResponse = await axios.get(
        `${url}/api/user/health?siteId=${siteId}&yearMonthDay=${formattedDate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const healthJson = typeof healthResponse.data === 'string' ? JSON.parse(healthResponse.data) : healthResponse.data;
      const healthDataArray = healthJson.Data || [];

      // healthDataArray를 순회하면서 각 사용자에 대한 데이터 업데이트
      healthDataArray.forEach((healthItem) => {
        const userId = healthItem.UserId; // 각 데이터 항목에서 사용자 ID 추출

        // 기존 데이터와 비교하여 변경된 경우에만 업데이트
        setHealthData((prevData) => {
          const existingData = prevData[userId]?.[formattedDate];
          if (!isEqual(existingData, healthItem)) {
            return {
              ...prevData,
              [userId]: {
                ...(prevData[userId] || {}),
                [formattedDate]: healthItem,
              },
            };
          }
          return prevData; // 변경되지 않았으므로 상태 업데이트하지 않음
        });

        // users 배열에 해당 ID를 가진 사용자 객체를 찾아 데이터 업데이트
        setUsers((prevUsers) =>
          produce(prevUsers, (draft) => {
            const userDraft = draft.find((u) => u.id === userId);
            if (userDraft) {
              userDraft.data.bpm = getLastNonZero(
                healthItem.HeartRateArr
              );
              userDraft.data.oxygen = getLastNonZero(
                healthItem.BloodOxygenArr
              );
              userDraft.data.stress = getLastNonZero(healthItem.PressureArr);
              userDraft.data.sleep =
                healthItem.Sleep?.TotalSleepDuration || 0;
              userDraft.data.steps =
                healthItem.Sport?.slice(-1)[0]?.TotalSteps || 0;
              userDraft.data.calories =
                healthItem.Sport?.slice(-1)[0]?.Calorie || 0;
              userDraft.data.distance =
                healthItem.Sport?.slice(-1)[0]?.WalkDistance || 0;
              userDraft.data.heartRateArr =
                healthItem.HeartRateArr || [];
              userDraft.data.pressureArr =
                healthItem.PressureArr || [];
              userDraft.data.oxygenArr =
                healthItem.BloodOxygenArr || [];
              userDraft.data.hourlyData.steps =
                healthItem.Sport?.map((s) => s.TotalSteps) || [];
              userDraft.data.hourlyData.calories =
                healthItem.Sport?.map((s) => s.Calorie) || [];
              userDraft.data.hourlyData.distance =
                healthItem.Sport?.map((s) => s.WalkDistance) || [];
            }
          })
        );
      });
    } catch (error) {
      console.error('건강 데이터 fetching 오류:', error);
    }
  },
  [siteId, url, credentials]
  );

  // 사용자 및 링 데이터 가져오기 함수
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
  
      setAvailableRings(ringData);
  
      const ringMap = new Map();
      ringData.forEach(ring => {
        ringMap.set(ring.MacAddr, ring);
      });
  
      // 이전 사용자 맵 생성
      setUsers((prevUsers) => {
        try {
          const prevUsersMap = new Map(prevUsers.map(user => [user.id, user]));
  
          const updatedUsers = userData.map((user) => {
            const prevUser = prevUsersMap.get(user.Id);
  
            // 기존 data 필드가 있으면 사용하고, 없으면 초기값 설정
            const data = prevUser ? prevUser.data : {
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
              temperature: getRandomTemperature(), // 체온 초기값
              bloodPressure: getRandomBloodPressure(), // 혈압 초기값
            };

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
            const userRing = ringMap.get(user.MacAddr) || {};
  
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
              ring: userRing,
              isFavorite: user.Favorite || false,
              CreateDateTime: user.CreateDateTime,
              data: data, // 기존 데이터 사용 또는 초기값 설정
              thresholds: {
                heartRateWarningLow: user.WarningHeartRate ? user.WarningHeartRate[0] : 80,
                heartRateWarningHigh: user.WarningHeartRate ? user.WarningHeartRate[1] : 120,
                heartRateDangerLow: user.DangersHeartRate ? user.DangersHeartRate[0] : 70,
                heartRateDangerHigh: user.DangersHeartRate ? user.DangersHeartRate[1] : 140,
              },
            };
          });
  
          // 변경 감지 및 상태 업데이트
          const changedUsers = [];
  
          const mergedUsers = updatedUsers.map(user => {
            const prevUser = prevUsersMap.get(user.id);
            if (!prevUser) {
              changedUsers.push(user);
              return user;
            }
  
            const { ring: prevRing, data: prevData, ...prevUserRest } = prevUser;
            const { ring: newRing, data: newData, ...newUserRest } = user;
  
            let isChanged = false;
  
            if ((prevRing == null && newRing != null) || (prevRing != null && newRing == null)) {
              isChanged = true;
            } else if (prevRing && newRing) {
              const { ConnectedTime: _, ...prevRingRest } = prevRing;
              const { ConnectedTime: __, ...newRingRest } = newRing;
  
              if (!isEqual(prevRingRest, newRingRest)) {
                isChanged = true;
              }
            }
  
            if (!isEqual(prevUserRest, newUserRest)) {
              isChanged = true;
            }
  
            if (isChanged) {
              const updatedUser = {
                ...user,
                data: prevData, // 기존 data 유지
              };
              changedUsers.push(updatedUser);
              return updatedUser;
            }
  
            return prevUser; // 변경되지 않은 경우 기존 객체 반환
          });
  
          if (changedUsers.length > 0) {
            return mergedUsers;
          } else {
            return prevUsers;
          }
        } catch (e) {
          console.error('사용자 데이터 경 감지 오류:', e);
          return prevUsers; // 오류 발생 시 기존 상태 유지
        }
      });
  
      const today = new Date(); // 오늘 날짜로 설정
      fetchHealthData(0, today);
  
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
      const cachedImageData = loadFromSessionStorage(`floorPlanImage_${siteId}`, null);
      if (cachedImageData) {
        const img = new Image();
        img.onload = () => {
          setFloorPlanImage(img);
          // 캔버스 크기 조정은 FloorPlan 컴포넌트에서 처리리
        };
        img.src = cachedImageData;
      } else {
        // 서버에서 배치도 이미지 가져오기
        const imageResponse = await axios.get(`${url}/api/site/image?siteId=${siteId}`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
          responseType: 'blob', // 이미지 이 타입 설정
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
        // saveToSessionStorage('devices', fetchedDevices); // 제거
      } else {
        console.error('스마트폰 위치 데이터 불러오기 실패:', deviceResponse.statusText);
        setDevices([]); // 오류 발생 시 devices 상태를 빈 배열로 설정
        // saveToSessionStorage('devices', []); // 제거
      }
    } catch (error) {
      console.error('스마트폰 위치 데이터 불러오기 오류:', error);
      setDevices([]); // 오류 발생 시 devices 상태를 빈 배열로 설정
      // saveToSessionStorage('devices', []); // 제거
    } finally {
      setIsLoading(false);
    }
  }, [siteId, credentials, url]);

  useEffect(() => {
    if (!isLoggedIn || !siteId || !isLocked) return;

    if (!intervalRef.current) {
      // 초기 데이터 로드
      fetchUsersAndRingData();
      handleLoadFloorPlan();

      intervalRef.current = setInterval(() => {
        console.log('30초마다 사용자 및 링 데이터 가져오기');
        
        if (currentPath.startsWith('/users/')) {
          // UserDetail 페이지일 경우 해당 사용자만 업데이트
          const userId = currentPath.split('/users/')[1]; // URL에서 userId 추출
          if (userId) {
           // fetchHealthData(parseInt(userId), new Date());
          }
        } else {
          // 일반적인 업데이트
          fetchUsersAndRingData();
          handleLoadFloorPlan();
        }
      }, 30000); // 30초

    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentPath, fetchUsersAndRingData, handleLoadFloorPlan, fetchHealthData, isLoggedIn, siteId, isLocked]);

  useEffect(() => {
    if (floorPlanImage && floorPlanImage.src && siteId) {
      saveToSessionStorage(`floorPlanImage_${siteId}`, floorPlanImage.src);
    }
  }, [floorPlanImage, siteId]);

  // 초기 로그인 시 사용자 데이터 로드 수정
  useEffect(() => {
    if (isLoggedIn && siteId) {

          // 이미 로드된 사용자에 대해 호출 방지 (macAddr이 있 경우에만)
      users.forEach(user => { // 변경: storedUsers 대신 users
        if (user.macAddr) {
          const today = new Date();
          const formattedDate = formatDateYYMMDD(today);
          const key = `${user.id}_${formattedDate}`;

          setHealthData((prevData) => {
            if (!prevData[key]) {
              fetchHealthData(user.id, today); // 데이터가 없는 경우에만 호출
            }
            return prevData;
          });
        } else {
          console.warn(`사용자 ${user.id} (${user.name})에게 macAddr이 없습니다. 건강 데이터 요청을 건너뜁니다.`);
        }
      });
    }
  }, [isLoggedIn, siteId, fetchHealthData]);

  // 새로운 ID 생성 함수 (변경 없음)
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

  const formatCreateDateTime = () => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // 마지막 두 자리 연도
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 월 (0부터 시작하로 +1)
    const day = String(now.getDate()).padStart(2, '0'); // 날짜
    const hour = String(now.getHours()).padStart(2, '0'); // 시
    const minute = String(now.getMinutes()).padStart(2, '0'); // 분
    const second = String(now.getSeconds()).padStart(2, '0'); // 초
  
    return `${year}${month}${day}${hour}${minute}${second}`;
  };

  // 상태 초기화 함수 추가
  const resetState = useCallback(() => {
    setUsers([]);
    setDevices([]);
    setAvailableRings([]);
    setFloorPlanImage(null);
    setHealthData({});
    setSortOption('이름 순');
    setSearchQuery('');
    setSuccessMessage('');
    setDisconnectInterval(5);
    setIsLocked(true);
    // 추가적인 상태가 있다면 여기서 초기화
  }, []);

  // 사용자 추가 함수 수정: 세션 스토리지 관련 코드 제거
  const handleAddUser = useCallback(
    async (newUser) => {
      if (!siteId) {
        alert('사이트 ID가 설정되지 않았습니다.');
        return;
      }

      try {
        const apiUrl = `${url}/api/user`;
        const gender = newUser.gender === '남성' || newUser.gender === 0 ? 0 : 1;
        const createDateTime = formatCreateDateTime();

        let newId = getNewId(users);

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
              CreateDateTime: createDateTime, // 생성 시간 추가
            },
          }),
        });

        const responseText = await response.text();

        if (response.ok && responseText.includes('User Insert success')) {

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
              temperature: getRandomTemperature(), // 체온 초기값
              bloodPressure: getRandomBloodPressure(), // 혈압 초기값
            },
            thresholds: {
              heartRateWarningLow: 80,
              heartRateWarningHigh: 120,
              heartRateDangerLow: 70,
              heartRateDangerHigh: 140,
            },
          };

          setUsers((prevUsers) => [...prevUsers, createdUser]); // 수정: newUser 대신 createdUser
          setShowModal(false);

          // 공 메시지 설정
          setSuccessMessage('사용자가 추가되었습니다.');

          // 3초 후 메시지 자동 제거
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);

          // 새로 추가된 사용자에 대해 건강 데이터 가져오기 (macAddr이 있는 경우에만)
          if (createdUser.macAddr) {
            const today = new Date();
            fetchHealthData(newId, today);
          } else {
            console.warn(`추가된 사용자 ${createdUser.id} (${createdUser.name})에게 macAddr이 없습니다. 건강 데이터 요청을 건너뜁니다.`);
          }

        } else {
          console.error('서버에 사용자 추가 실패:', responseText);
          alert('서버에 사용자를 추가하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 추가 오류:', error);
        alert('사용자 추가 중 오류가 발생했습니다.');
      }
    },
    [users, siteId, credentials, fetchHealthData, getNewId, url, getRandomTemperature, getRandomBloodPressure]
  );

  // 사용자 업데이트 함수 수정: 세션 스토리지 관련 코드 제거
  const updateUser = useCallback(
    async (updatedUser, sendTo_server = false) => {
      console.log('사용자 업데이트:', updatedUser);

      // 기존 사용자 데이터와 비교하여 변경된 경우에만 상태 업데이트
      setUsers((prevUsers) => {
        return produce(prevUsers, draft => {
          const user = draft.find(u => u.id === updatedUser.id);
          if (user) {
            Object.assign(user, updatedUser);
          }
        });
      });

      // 서버에 업데이트 요청
      if (sendTo_server && siteId) {
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
                Temperature: updatedUser.temperature, // 체온 포함
                BloodPressure: updatedUser.bloodPressure, // 혈압 포함
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
    [siteId, credentials, url]
  );

  // 사용자 삭제 함수 수정: 세션 스토리지 관련 코드 제거
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
          alert('서버에서 사용자를 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('사용자 삭제 오류:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    },
    [siteId, credentials, url]
  );

  // 즐겨찾 토글 함수 수정: 세션 스토리지 관련 코드 제거
  const toggleFavorite = useCallback(
    (userId) => {
      const userToUpdate = users.find((user) => user.id === userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate, isFavorite: !userToUpdate.isFavorite };

        // 서버 업데이트
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
          // saveToSessionStorage('adminInfo', updatedAdminInfo); // 제거
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const [newUser, setNewUser] = useState({
    name: '',
    gender: '',
    age: '',
  });

  // Handle User Addition from Modal
  const handleModalSubmit = useCallback(async () => {
    if (!newUser.name || !newUser.gender || !newUser.age) {
      alert('모든 필드를 입력하세요.');
      return;
    }
  
    try {
      const gender = Number(newUser.gender);
      const createDateTime = formatDateTime(new Date());
  
      let newId = getNewId(users);
      const userToAdd = {
        ...newUser,
        id: newId,
        gender: gender,
        CreateDateTime: createDateTime,
      };
  
      await handleAddUser(userToAdd);
      setNewUser({ name: '', gender: '', age: '' });
      setShowModal(false);
    } catch (error) {
      console.error('사용자 추가 실패:', error);
      alert('사용자 추가 중 오류가 발생했습니다.');
    }
  }, [newUser, handleAddUser, formatDateTime, users, getNewId]);

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      {isLoggedIn ? (
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            users={users}
            setIsLoggedIn={setIsLoggedIn}
            sortOption={sortOption}
            siteId={Cookies.get('siteId')}
            resetState={resetState}
          />
          <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
            <Header
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
              siteName={Cookies.get('siteId')}
              userName={Cookies.get('adminId')}
              setShowModal={setShowModal}
              setSearchQuery={setSearchQuery}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pt-20">
              {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                  <div className="bg-white p-8 rounded-lg shadow-lg w-[500px]">
                    <h2 className="text-xl font-bold mb-4">새 사용자 추가</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block">이름</label>
                        <input
                          type="text"
                          name="name"
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                          }
                          className="p-2 border border-gray-300 rounded w-full"
                          placeholder="이름을 입력하세요"
                        />
                      </div>
                      <div>
                        <label className="block">성별</label>
                        <select
                          name="gender"
                          value={newUser.gender !== '' ? newUser.gender : ''}
                          onChange={(e) =>
                            setNewUser({ ...newUser, gender: e.target.value })
                          }
                          className="p-2 border border-gray-300 rounded w-full"
                        >
                          <option value="">성별을 선택하세요</option>
                          <option value="0">남성</option>
                          <option value="1">여성</option>
                        </select>
                      </div>
                      <div>
                        <label className="block">나이</label>
                        <input
                          type="number"
                          name="age"
                          value={newUser.age}
                          onChange={(e) =>
                            setNewUser({ ...newUser, age: e.target.value })
                          }
                          className="p-2 border border-gray-300 rounded w-full"
                          placeholder="나이를 입력하세요"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={handleModalSubmit}
                        className="bg-blue-500 text-white py-2 px-4 rounded"
                      >
                        사용자 추가
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="bg-gray-300 text-black py-2 px-4 rounded"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </Modal>
              )}
              <Routes>
                <Route
                  path="/"
                  element={
                    <MemoizedDashboard
                      showModal={showModal}
                      setShowModal={setShowModal}
                      users={users}
                      setUsers={setUsers}
                      searchQuery={searchQuery}
                      handleAddUser={handleAddUser}
                      updateUser={updateUser}
                      sortOption={sortOption}
                      deleteUser={deleteUser}
                      toggleFavorite={toggleFavorite}
                      availableRings={availableRings}
                      disconnectInterval={disconnectInterval}
                      devices={devices}
                      getNewId={getNewId}
                    />
                  }
                />
                <Route
                  path="/users/:userId"
                  element={
                    <MemoizedUserDetail
                      users={users}
                      updateUserLifeLog={updateUser}
                      siteId={siteId}
                      fetchHealthData={fetchHealthData}
                      healthData={healthData}
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
                      devices={devices}
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
                      isLocked={isLocked}
                      setIsLocked={setIsLocked}
                    />
                  }
                />
                <Route
                  path="/devices"
                  element={
                    <DeviceManagement
                      users={users}
                      setUsers={setUsers}
                      siteId={Cookies.get('siteId')}
                      fetchUsers={fetchUsersAndRingData}
                      setActiveComponent={setActiveComponent}
                      devices={devices}
                      availableRings={availableRings}
                      toggleSidebar={toggleSidebar}
                      isSidebarOpen={isSidebarOpen}
                      userName={Cookies.get('adminId')}
                    />
                  }
                />
                <Route
                  path="/datagridview"
                  element={
                    <>
                      <DataGridView users={users} setShowModal={setShowModal} />
                    </>
                  }
                />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn} setSiteId={setSiteId} />
      )}
    </Router>
  );
}

export default App;
