// src/Components/UserDetail.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FaEdit, FaPlus, FaHeartbeat, FaBed, 
  FaSmile, FaTint, FaWalking, FaFireAlt, FaRoute 
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import Modal from './Modal';
import CustomLegend from './CustomLegend';
import { calculateSleepScore } from './CalculateUserStatus_2';
import axios from 'axios';

// Helper Function to get the last non-zero value
const getLastNonZero = (arr = []) => {
  if (!Array.isArray(arr)) {
    console.warn('getLastNonZero: arr is not an array', arr);
    return 0;
  }
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== 0) {
      return arr[i];
    }
  }
  return 0; // Return 0 if all values are zero
};

// Reusable InfoCard Component
const InfoCard = ({ icon, title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);


// 세션 스토리지 관련 헬퍼 함수
const loadFromSessionStorage = (key, defaultValue) => {
  const stored = sessionStorage.getItem(key);
  if (!stored) return defaultValue;

  // JSON 파싱이 필요한 키 목록
  const jsonKeys = ['healthData'];

  if (jsonKeys.includes(key)) {
    try {
      const parsed = JSON.parse(stored);
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

const UserDetail = ({ users, updateUserLifeLog, siteId, devices, API_URL, CREDENTIALS }) => {
  const { userId } = useParams();  // Get userId from URL

  // 사용자 상태를 useState로 관리
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // 기본 날짜는 오늘
  const [isLoading, setIsLoading] = useState(false);
  const [healthData, setHealthData] = useState(() => loadFromSessionStorage('healthData', {})); // 초기 상태 로드
  const [error, setError] = useState(null); // 에러 상태 추가
  
  const isToday = useCallback((date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);
  
  // 날짜 형식 변환 함수 (YYMMDD)
  const formatDateYYMMDD = useCallback((date) => {
    const year = String(date.getFullYear()).slice(-2); // 마지막 두 자리
    const month = (`0${date.getMonth() + 1}`).slice(-2); // 월은 0부터 시작하므로 +1
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}${month}${day}`;
  }, []);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((e) => {
    const dateString = e.target.value;
    const selected = new Date(dateString);
    setSelectedDate(selected);
  }, []);

  const formatDateYYYYMMDD = useCallback((date) => {
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // 월은 0부터 시작하므로 +1
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`; // YYYY-MM-DD 포맷
  }, []);

  // 사용자 변경 시 user 상태 업데이트
  useEffect(() => {
    if (users && Array.isArray(users)) {
      const foundUser = users.find((u) => u.id === parseInt(userId));
      setUser(foundUser);
      console.log('Found user:', foundUser);
    } else {
      console.warn('users prop is not an array');
      setUser(null);
    }
  }, [users, userId]);

  // 사용자 데이터 구조 분해 (기본값 설정)
  const { data: userData = {} } = user || {};

  const {
    bpm = 0,
    oxygen = 0,
    stress = 0,
    sleep = 0,
    deepSleepDuration = 0, // 추가된 필드
    awakeDuration = 0,     // 추가된 필드
    shallowSleepDuration = 0, // 추가된 필드
    steps = 0,
    calories = 0,
    distance = 0,
    heartRateArr = [],
    oxygenArr = [],
    pressureArr = [],
    hourlyData = {},
  } = userData;

  // Sleep 점수 계산
  const sleepScore = useMemo(() => {
    if (
      sleep > 0 &&
      deepSleepDuration > 0 &&
      awakeDuration > 0 &&
      shallowSleepDuration > 0
    ) {
      return calculateSleepScore(
        sleep, // totalSleepDuration (분 단위)
        deepSleepDuration,
        awakeDuration,
        shallowSleepDuration
      );
    } else {
      return 0;
    }
  }, [sleep, deepSleepDuration, awakeDuration, shallowSleepDuration]);

  const lifeLogs = user?.lifeLogs || [];

  // State variables
  const [logItems, setLogItems] = useState(lifeLogs);
  const [sortOption, setSortOption] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    medicine: '',
    date: '',
    dose: '', // 'dose'는 '세부 사항'을 의미합니다.
    time: '12:00',
    taken: false,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showBpm, setShowBpm] = useState(true);
  const [showOxygen, setShowOxygen] = useState(true);
  const [showStress, setShowStress] = useState(true); // 추가된 부분
  const [showSteps, setShowSteps] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  // 건강 데이터 가져오기 함수 정의
  const fetchHealthData = useCallback(async (userId, date) => {
    if (!siteId || !userId) {
      setError('사이트 ID 또는 사용자 ID가 설정되지 않았습니다.');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const formattedDate = formatDateYYMMDD(date); // YYMMDD 형식으로 변환
      const key = `${userId}_${formattedDate}`;
  
      // 세션 스토리지에서 데이터 확인
      const cachedHealthData = loadFromSessionStorage('healthData', {});
      if (cachedHealthData[key] && Object.keys(cachedHealthData[key]).length > 0) {
        console.log('Using cached health data:', cachedHealthData[key]);
        setHealthData((prevData) => ({
          ...prevData,
          [key]: cachedHealthData[key],
        }));
        console.log("Health Data after Fetch:", healthData); // 여기를 추가

        console.log(`세션 스토리지에서 사용자 ${userId}의 건강 데이터 로드:`, cachedHealthData[key]);
      } else {
        const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
        const url = 'https://fitlife.dotories.com';
  
        // API 요청
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
  
        // healthData 상태 업데이트
        setHealthData((prevData) => ({
          ...prevData,
          [key]: latestHealthData,
        }));
  
   
  
        console.log(`사용자 ${userId}의 건강 데이터 가져오기 성공:`, latestHealthData);
      }
    } catch (healthError) {
      console.warn(`사용자 ${userId}의 건강 데이터 가져오기 실패:`, healthError.message);
      setError('건강 데이터 가져오기 실패');
      setHealthData((prevData) => ({
        ...prevData,
        [`${userId}_${formatDateYYMMDD(date)}`]: {},
      }));
    } finally {
      setIsLoading(false);
    }
  }, [siteId, formatDateYYMMDD]);
  
  

  // 건강 데이터 가져오기
  useEffect(() => {
    if (user && selectedDate) {
      fetchHealthData(user.id, selectedDate);
    }
  }, [user, selectedDate, fetchHealthData]);
  
  // 현재 선택한 사용자와 날짜에 해당하는 건강 데이터 가져오기
  const currentHealthData = useMemo(() => {
    if (user) {
      const key = `${user.id}_${formatDateYYMMDD(selectedDate)}`;
      console.log("Formatted Date (YYMMDD):", formatDateYYMMDD(selectedDate));

      
      console.log("Generated Key for Selected Date:", key);
      console.log("Selected Date:", selectedDate instanceof Date ? "Valid Date Object" : "Invalid Date Object");

console.log("Data in healthData for this Key:", healthData[key]);
      return healthData[key] || {};
    }
  }, [user, selectedDate, healthData, formatDateYYMMDD]);

  // Sorting Function
  const handleSort = useCallback((option) => {
    let sortedItems = [...logItems];

    if (option === '미복용') {
      // taken이 false인 항목을 상단에 정렬
      sortedItems.sort((a, b) => a.taken - b.taken); // false(0) < true(1)
    } else if (option === '처방일') {
      sortedItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (option === '복용시간') {
      sortedItems.sort((a, b) => a.time.localeCompare(b.time));
    }

    setLogItems(sortedItems);
    setSortOption(option);
    console.log(`Sorted Log Items by ${option}:`, sortedItems);
  }, [logItems]);

  // Checkbox Change Handler
  const handleCheckboxChange = useCallback((id) => {
    const updatedItems = logItems.map((item) =>
      item.id === id ? { ...item, taken: !item.taken } : item
    );
    setLogItems(updatedItems);

    // 업데이트된 user 객체 생성
    const updatedUser = {
      ...user,
      lifeLogs: updatedItems,
    };

    // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
    updateUserLifeLog(updatedUser, true);
    console.log('Updated Life Logs after Checkbox Change:', updatedItems);
  }, [logItems, updateUserLifeLog, user]);

  // Add Modal Toggle
  const toggleAddModal = useCallback(() => {
    setIsAddModalOpen(prev => !prev);
  }, []);

  // Open Edit Modal
  const openEditModal = useCallback((item) => {
    setEditItem({
      ...item,
      dose: item.dose, // '세부 사항'을 그대로 사용
    });
    setIsEditModalOpen(true);
    console.log('Opened Edit Modal for Item:', item);
  }, []);

  // Add Life Log Item
  const handleAddItem = useCallback(() => {
    const { medicine, date, dose, time } = newItem;
    if (!medicine || !date || !dose) {
      alert('모든 필드를 입력하세요.');
      return;
    }

    const newLogItem = {
      ...newItem,
      dose: dose, // '세부 사항'으로 변경
      id: logItems.length > 0 ? Math.max(...logItems.map(item => item.id || 0)) + 1 : 1,
    };

    const updatedLogItems = [...logItems, newLogItem];
    setLogItems(updatedLogItems);

    // 업데이트된 user 객체 생성
    const updatedUser = {
      ...user,
      lifeLogs: updatedLogItems,
    };

    // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
    updateUserLifeLog(updatedUser, true);
    console.log('Added New Life Log Item:', newLogItem);

    toggleAddModal();
    setNewItem({ medicine: '', date: '', dose: '', time: '12:00', taken: false });
  }, [newItem, logItems, updateUserLifeLog, user, toggleAddModal]);

  // Save Edited Life Log Item
  const handleSaveEditItem = useCallback(() => {
    const { medicine, date, dose, time } = editItem;
    if (!medicine || !date || !dose) {
      alert('모든 필드를 입력하세요.');
      return;
    }

    const updatedEditItem = {
      ...editItem,
      dose: dose, // '세부 사항'으로 변경
    };

    const updatedItems = logItems.map((item) =>
      item.id === editItem.id ? updatedEditItem : item
    );

    setLogItems(updatedItems);

    // 업데이트된 user 객체 생성
    const updatedUser = {
      ...user,
      lifeLogs: updatedItems,
    };

    // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
    updateUserLifeLog(updatedUser, true);
    console.log('Saved Edited Life Log Item:', updatedEditItem);

    setIsEditModalOpen(false);
    setEditItem(null);
  }, [editItem, logItems, updateUserLifeLog, user]);

  // Delete Life Log Item Handler
  const handleDeleteItem = useCallback(() => {
    if (window.confirm('정말 이 Life 로그를 삭제하시겠습니까?')) {
      const updatedItems = logItems.filter(item => item.id !== editItem.id);
      setLogItems(updatedItems);

      // 업데이트된 user 객체 생성
      const updatedUser = {
        ...user,
        lifeLogs: updatedItems,
      };

      // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
      updateUserLifeLog(updatedUser, true);
      console.log('Deleted Life Log Item with ID:', editItem.id);

      setIsEditModalOpen(false);
      setEditItem(null);
    }
  }, [editItem, logItems, user, updateUserLifeLog]);

  // Prepare log items for display
  const displayLogItems = useMemo(() => {
    return logItems.length > 0 ? logItems : [{
      id: 'empty-1',
      medicine: 'N/A',
      date: 'N/A',
      dose: 'N/A',
      time: 'N/A',
      taken: false,
    }];
  }, [logItems]);

  // XAxis Tick Marks (Every 2 hours)
  const xAxisTicks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => { // 24/2 = 12
      const hour = i * 2;
      return `${String(hour).padStart(2, '0')}:00`;
    });
  }, []);

  // Legend Items for BPM, Oxygen, and Stress
  const bpmOxygenLegend = useMemo(() => [
    { dataKey: 'bpm', value: '심박수 (BPM)', color: 'red', show: showBpm, setShow: setShowBpm },
    { dataKey: 'oxygen', value: '혈중 산소포화도 (%)', color: '#1e88e5', show: showOxygen, setShow: setShowOxygen },
    { dataKey: 'stress', value: '스트레스 지수', color: '#FFD700', show: showStress, setShow: setShowStress },
  ], [showBpm, showOxygen, showStress]);

  // Legend Items for Activity Data
  const activityLegend = useMemo(() => [
    { dataKey: 'steps', value: '걸음수', color: '#82ca9d', show: showSteps, setShow: setShowSteps },
    { dataKey: 'calories', value: '소모 칼로리 (kcal)', color: '#ff9800', show: showCalories, setShow: setShowCalories },
    { dataKey: 'distance', value: '이동거리 (km)', color: '#4caf50', show: showDistance, setShow: setShowDistance },
  ], [showSteps, showCalories, showDistance]);

  // Prepare data for 일별 데이터 선그래프
  const dailyLineChartData = useMemo(() => {
    // currentHealthData 확인
    if (!currentHealthData || Object.keys(currentHealthData).length === 0) {
      console.warn("currentHealthData is empty or undefined");
      return [];
    }
  
    // 데이터 추출
    const { HeartRateArr = [], BloodOxygenArr = [], PressureArr = [] } = currentHealthData;
  
    // 데이터 생성
    const data = [];
    for (let i = 0; i < 288; i++) { // 24 hours * 12 intervals per hour (5 minutes)
      const hour = Math.floor(i / 12);
      const minute = (i % 12) * 5;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  
      data.push({
        time,
        bpm: HeartRateArr[i] !== undefined && HeartRateArr[i] !== 0 ? HeartRateArr[i] : null,
        oxygen: Math.floor(i / 12) < BloodOxygenArr.length
          ? (BloodOxygenArr[Math.floor(i / 12)] !== 0 ? BloodOxygenArr[Math.floor(i / 12)] : null)
          : null,
        stress: Math.floor(i / 6) < PressureArr.length
          ? (PressureArr[Math.floor(i / 6)] !== 0 ? PressureArr[Math.floor(i / 6)] : null)
          : null,
      });
    }
  
    return data;
  }, [currentHealthData]);
  
  // Prepare data for 활동 데이터 그래프
  const activityLineChartData = useMemo(() => {
    if (!currentHealthData || !currentHealthData.Sport || currentHealthData.Sport.length === 0) {
      console.warn("Sport data is empty or undefined");
      return [];
    }
  
    const sportData = currentHealthData.Sport;
  
    // 데이터 생성
    const data = sportData.map((item, index) => {
      const hour = Math.floor(index / 2); // 매 2개의 데이터가 1시간
      const minute = (index % 2) * 30; // 30분 간격
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  
      return {
        time,
        steps: item.TotalSteps || 0,
        calories: item.Calorie ? (item.Calorie / 1000).toFixed(2) : 0, // Convert to kcal
        distance: item.WalkDistance ? (item.WalkDistance / 1000).toFixed(2) : 0, // Convert to km
      };
    });
  
    return data;
  }, [currentHealthData]);
  
  

  // 포맷팅 함수 (링 연결 시간)
  const formatConnectedTime = useCallback((timeString) => {
    if (!timeString || timeString.length !== 12) {
      return 'Invalid format';
    }
  
    const year = `20${timeString.slice(0, 2)}`; // YY -> 20YY
    const month = timeString.slice(2, 4) - 1; // MM (0-indexed for JavaScript Date)
    const day = timeString.slice(4, 6); // DD
    const hours = timeString.slice(6, 8); // hh
    const minutes = timeString.slice(8, 10); // mm
    const seconds = timeString.slice(10, 12); // ss
  
    const date = new Date(year, month, day, hours, minutes, seconds);
  
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  }, []);

  const lastSteps = useMemo(() => {
    if (!currentHealthData || !currentHealthData.Sport) {
      console.warn("Sport data is undefined or empty");
      return 0;
    }
    return getLastNonZero(currentHealthData.Sport.map(item => item.TotalSteps));
  }, [currentHealthData]);
  
  const lastCalories = useMemo(() => {
    if (!currentHealthData || !currentHealthData.Sport) {
      console.warn("Sport data is undefined or empty");
      return 0;
    }
    return getLastNonZero(currentHealthData.Sport.map(item => item.Calorie)) / 1000; // Convert to kcal
  }, [currentHealthData]);
  
  const lastDistance = useMemo(() => {
    if (!currentHealthData || !currentHealthData.Sport) {
      console.warn("Sport data is undefined or empty");
      return 0;
    }
    return getLastNonZero(currentHealthData.Sport.map(item => item.WalkDistance)) / 1000; // Convert to km
  }, [currentHealthData]);
  
  
  return (
    <div className="p-4">
      {/* User Profile Header */}
      <div className="profile-header flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{user?.name || 'N/A'}</h2>
            <p className="text-gray-600"> &nbsp;&nbsp;&nbsp;{user?.age || 'N/A'}세</p>
          </div>
        </div>
        <div className="flex items-center">
        <input
        type="date"
        value={formatDateYYYYMMDD(selectedDate)}
        onChange={handleDateChange}
        className="p-2 border border-gray-300 rounded-lg"
        max={formatDateYYYYMMDD(new Date())} // 오늘 날짜까지만 선택 가능
        aria-label="날짜 선택"
      />
        </div>
      </div>

      {/* 사용자 없을 경우 메시지 */}
      {!user && <p>사용자를 찾을 수 없습니다.</p>}

      {user && (
        <>
          {/* 링 정보 섹션 */}
          {user.ring && (
            <div className="ring-info bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold mb-4">링 정보</h3>
              <div className="flex space-x-8 items-center">
                <p><strong>이름:</strong> {user.ring.Name}</p>
                <p><strong>연결 시간:</strong> {user.ring.ConnectedTime ? formatConnectedTime(user.ring.ConnectedTime) : 'N/A'}</p>
                <p><strong>배터리 수준:</strong> {user.ring.BatteryLevel !== undefined ? `${user.ring.BatteryLevel}%` : 'N/A'}</p>
              </div>
            </div>
          )}

{/* 건강 정보 카드 */}
<div className="info-boxes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <InfoCard
    icon={<FaHeartbeat className="text-red-500" />}
    title="심박수"
    value={`${getLastNonZero(currentHealthData.HeartRateArr || [])} BPM`}
  />
  <InfoCard
    icon={<FaTint className="text-blue-500" />}
    title="혈중 산소"
    value={`${getLastNonZero(currentHealthData.BloodOxygenArr || [])}%`}
  />
  <InfoCard
    icon={<FaSmile className="text-yellow-500" />}
    title="스트레스"
    value={`${getLastNonZero(currentHealthData.PressureArr || [])} 점`}
  />
  <InfoCard
    icon={<FaBed className="text-gray-500" />}
    title="수면 점수"
    value={`${sleepScore} 점`} // 수면 점수는 그대로 유지
  />
</div>


          {/* 일별 데이터 선그래프 */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4">일별 데이터</h3>

            {isLoading ? (
              <p>데이터를 불러오는 중...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyLineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    ticks={xAxisTicks} 
                    interval={11} // Show ticks at every 2 hours (0, 2, 4, ..., 22)
                    tick={{ fontSize: 12 }}
                    tickFormatter={(tick) => tick}
                  />
                  <YAxis domain={[0, 200]} />
                  <Tooltip />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    content={<CustomLegend legendItems={bpmOxygenLegend} />} 
                  />
                  {showBpm && (
                    <Line 
                      type="monotone"
                      dataKey="bpm"
                      stroke="red"
                      strokeWidth={2}
                      connectNulls={true}
                      name="심박수 (BPM)"
                      dot={false}
                    />
                  )}
                  {showOxygen && (
                    <Line 
                      type="monotone"
                      dataKey="oxygen"
                      stroke="#1e88e5"
                      strokeWidth={2}
                      connectNulls={true}
                      name="혈중 산소포화도 (%)"
                      dot={false}
                    />
                  )}
                  {showStress && (
                    <Line 
                      type="monotone"
                      dataKey="stress"
                      stroke="#FFD700"
                      strokeWidth={2}
                      connectNulls={true}
                      name="스트레스 지수"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 걸음수, 소모 칼로리, 이동거리 정보 */}
          <div className="additional-info mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <InfoCard 
              icon={<FaWalking className="text-green-500" />} 
              title="걸음수" 
              value={`${lastSteps} 걸음`} 
            />
            <InfoCard 
              icon={<FaFireAlt className="text-orange-500" />} 
              title="소모 칼로리" 
              value={`${(lastCalories ).toFixed(2)} kcal`} 
            />
            <InfoCard 
              icon={<FaRoute className="text-blue-500" />} 
              title="이동거리" 
              value={`${(lastDistance ).toFixed(2)} km`} 
            />
          </div>

          {/* 활동 데이터 그래프 */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4">활동 데이터 (걸음수, 소모 칼로리, 이동거리)</h3>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={activityLineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  ticks={xAxisTicks} 
                  interval={5} // Show ticks at every 2 hours
                  tick={{ fontSize: 12 }}
                  tickFormatter={(tick) => tick}
                />
                <YAxis />
                <Tooltip />
                
                {/* Custom Legend with Checkboxes */}
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  content={<CustomLegend legendItems={activityLegend} />} 
                />

                {showSteps && (
                  <Line 
                    type="monotone" 
                    dataKey="steps" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    connectNulls={true}
                    name="걸음수"
                    dot={false} // 점 숨기기
                  />
                )}

                {showCalories && (
                  <Line 
                    type="monotone" 
                    dataKey="calories" // dataKey는 'calories'로 유지
                    stroke="#ff9800" 
                    strokeWidth={2}
                    connectNulls={true}
                    name="소모 칼로리 (kcal)"
                    dot={false} // 점 숨기기
                  />
                )}

                {showDistance && (
                  <Line 
                    type="monotone"
                    dataKey="distance"
                    stroke="#4caf50"
                    strokeWidth={2}
                    connectNulls={true}
                    name="이동 거리 (km)"
                    dot={false} // 점 숨기기
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Life 로그 섹션 */}
          <div className="life-log bg-white p-4 rounded-lg shadow-md mt-6">
            <h3 className="text-xl font-bold mb-4">Life 로그</h3>
            <div className="flex justify-between items-center mb-4">
              <select
                value={sortOption}
                onChange={(e) => handleSort(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg"
                aria-label="로그 정렬 옵션 선택"
              >
                <option value="all">전체</option>
                <option value="미복용">미복용</option>
                <option value="처방일">처방일</option>
                <option value="복용시간">복용시간</option>
              </select>
              <FaPlus 
                className="text-blue-500 text-2xl cursor-pointer" 
                onClick={toggleAddModal} 
                title="로그 추가"
                aria-label="로그 추가 버튼"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-center">복용</th> {/* 새 체크박스 헤더 */}
                    <th className="p-2">복용약</th>
                    <th className="p-2">처방일</th>
                    <th className="p-2">세부 사항</th> {/* 변경 */}
                    <th className="p-2">복용 시간</th>
                    <th className="p-2">수정</th>
                  </tr>
                </thead>
                <tbody>
                  {displayLogItems.map((item) => (
                    <tr key={item.id} className={item.taken ? 'bg-green-100' : ''}>
                      <td className="p-2 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={item.taken}
                            onChange={() => handleCheckboxChange(item.id)}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            aria-label={`복용 여부 체크박스: ${item.medicine}`}
                          />
                          <span className="ml-2 text-gray-700"></span>
                        </label>
                      </td>
                      <td className="p-2">{item.medicine || 'N/A'}</td>
                      <td className="p-2">{item.date || 'N/A'}</td>
                      <td className="p-2">{item.dose || 'N/A'}</td>  {/* 세부 사항을 여기에 표시 */}
                      <td className="p-2">{item.time || 'N/A'}</td>
                      <td className="p-2">
                        {item.id !== 'empty-1' && item.id !== null && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="수정 버튼"
                          >
                            <FaEdit size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Life 로그 추가 모달 */}
          {isAddModalOpen && (
            <Modal onClose={() => setIsAddModalOpen(false)}>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4">새 Life 로그 추가</h3>

                {/* 복용약 입력 */}
                <label className="block mb-2">복용약</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  placeholder="복용약 입력"
                  value={newItem.medicine}
                  onChange={(e) => setNewItem({ ...newItem, medicine: e.target.value })}
                  aria-label="복용약 입력 필드"
                />

                {/* 처방일 입력 */}
                <label className="block mb-2">처방일</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={newItem.date}
                  onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                  aria-label="처방일 입력 필드"
                />

                {/* 세부 사항 입력 */}
                <label className="block mb-2">세부 사항</label>
                <input
                  type="text" // number -> text로 변경
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  placeholder="세부 사항 입력"
                  value={newItem.dose}
                  onChange={(e) => setNewItem({ ...newItem, dose: e.target.value })}
                  aria-label="세부 사항 입력 필드"
                />

                {/* 복용 시간 선택 */}
                <label className="block mb-2">복용 시간</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={newItem.time}
                  onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                  aria-label="복용 시간 선택 필드"
                >
                  {Array.from({ length: 24 }, (_, i) =>
                    ['00', '30'].map((minute) => (
                      <option key={`${i}:${minute}`} value={`${String(i).padStart(2, '0')}:${minute}`}>
                        {`${String(i).padStart(2, '0')}:${minute}`}
                      </option>
                    ))
                  )}
                </select>

                {/* 추가/닫기 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                    onClick={handleAddItem}
                    aria-label="Life 로그 추가 버튼"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg"
                    aria-label="모달 닫기 버튼"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Life 로그 수정 모달 */}
          {isEditModalOpen && editItem && (
            <Modal onClose={() => setIsEditModalOpen(false)}>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-4">Life 로그 수정</h3>

                {/* 복용약 입력 */}
                <label className="block mb-2">복용약</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.medicine}
                  onChange={(e) => setEditItem({ ...editItem, medicine: e.target.value })}
                  aria-label="복용약 수정 필드"
                />

                {/* 처방일 입력 */}
                <label className="block mb-2">처방일</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.date}
                  onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                  aria-label="처방일 수정 필드"
                />

                {/* 세부 사항 입력 */}
                <label className="block mb-2">세부 사항</label>
                <input
                  type="text" // number -> text로 변경
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.dose}
                  onChange={(e) => setEditItem({ ...editItem, dose: e.target.value })}
                  aria-label="세부 사항 수정 필드"
                />

                {/* 복용 시간 선택 */}
                <label className="block mb-2">복용 시간</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.time}
                  onChange={(e) => setEditItem({ ...editItem, time: e.target.value })}
                  aria-label="복용 시간 수정 필드"
                >
                  {Array.from({ length: 24 }, (_, i) =>
                    ['00', '30'].map((minute) => (
                      <option key={`${i}:${minute}`} value={`${String(i).padStart(2, '0')}:${minute}`}>
                        {`${String(i).padStart(2, '0')}:${minute}`}
                      </option>
                    ))
                  )}
                </select>

                {/* 저장/삭제/닫기 버튼 */}
                <div className="flex justify-end space-x-4">
                  {/* 삭제 버튼 추가 */}
                  <button
                    className="bg-red-500 text-white py-2 px-4 rounded-lg"
                    onClick={handleDeleteItem}
                    aria-label="Life 로그 삭제 버튼"
                  >
                    삭제
                  </button>
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                    onClick={handleSaveEditItem}
                    aria-label="Life 로그 저장 버튼"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg"
                    aria-label="모달 닫기 버튼"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default UserDetail;