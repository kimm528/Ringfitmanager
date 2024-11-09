// src/components/UserDetail.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
// import { calculateUserStatus } from './calculateUserStatus'; // 필요 시 임포트

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

const UserDetail = ({ users, updateUserLifeLog, siteId }) => {
  const { userId } = useParams();  // Get userId from URL

  // 사용자 상태를 useState로 관리
  const [user, setUser] = useState(null);

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
  const {
    sleep = 0,
  } = user || {};

  const processedSleep = typeof sleep === 'object' ? sleep.score || 0 : sleep;

  const lifeLogs = user?.lifeLogs || [];

  // State variables
  const [logItems, setLogItems] = useState(lifeLogs);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Use Date object
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
  const [activityLineChartData, setActivityLineChartData] = useState([]);
  const [processedRingData, setProcessedRingData] = useState({
    latestBpm: 0,
    averageOxygen: 0,
    steps: 0,
    calories: 0,
    distance: 0,
    stress: 0,
  });
  const [lineChartData, setLineChartData] = useState([]);
  const [showBpm, setShowBpm] = useState(true);
  const [showOxygen, setShowOxygen] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [selectedRingData, setSelectedRingData] = useState(null); // State to hold fetched ring data

  // 캐시를 useRef로 관리
  const ringDataCacheRef = React.useRef({});

  // Helper to check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  // Fetch ring data by date with caching
  const fetchRingDataByDate = useCallback(async (date, userMacAddr) => { 
    try {
      const dateKey = date.toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식
      const cacheKey = `${dateKey}_${userMacAddr}`; // 캐시 키에 사용자 MAC 주소 포함

      // 캐시에 데이터가 있는지 확인
      if (ringDataCacheRef.current[cacheKey]) {
        console.log(`Using cached data for ${cacheKey}`);
        return ringDataCacheRef.current[cacheKey];
      }

      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      
      // 날짜를 'YYMMDD' 형식으로 변환
      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}${month}${day}`; // 예: '240930'

      console.log(`Fetching ring data for formattedDate: ${formattedDate} and macAddr: ${userMacAddr}`);

      // MAC 주소를 쿼리 파라미터에 포함
      const ringUrl = `https://fitlife.dotories.com/api/ring?siteId=${siteId}&yearMonthDay=${formattedDate}&macAddr=${userMacAddr}`;

      const response = await axios.get(ringUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });
      
      if (response.status !== 200) {
        throw new Error(`API response error: ${response.status}`);
      }
    
      const jsonDataIndex = JSON.parse(response.data); 
      const dataIndex = jsonDataIndex.Data.findIndex(
        (item) => item.MacAddr === userMacAddr
      );

      if (dataIndex === -1) {
        throw new Error('MAC 주소에 해당하는 데이터가 없습니다.');
      }

      const fetchedData = jsonDataIndex.Data[dataIndex];

      // 캐시에 저장
      ringDataCacheRef.current[cacheKey] = fetchedData;

      return fetchedData;
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return null;
    }
  }, [siteId]);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((e) => {
    const dateString = e.target.value;
    const selected = new Date(dateString);
    setSelectedDate(selected);
  }, []);

  // 선택된 날짜 또는 사용자가 변경될 때 링 데이터 가져오기
  useEffect(() => {
    if (user && selectedDate) {
      const userMacAddr = user.macAddr;

      if (!userMacAddr) {
        console.error('User MAC address not found.');
        setSelectedRingData(null); // 이전 데이터 초기화
        return;
      }

      const fetchData = async () => {
        if (isToday(selectedDate) && user.ring) {
          console.log('Using user.ring data for today');
          setSelectedRingData(user.ring);
        } else {
          const data = await fetchRingDataByDate(selectedDate, userMacAddr);
          if (data) {
            setSelectedRingData(data);
          } else {
            setSelectedRingData(null);
          }
        }
      };

      fetchData();
    } else {
      setSelectedRingData(null);
    }
  }, [selectedDate, user, fetchRingDataByDate]);

  // 선택된 링 데이터가 변경될 때 데이터 처리
  useEffect(() => {
    if (selectedRingData) {
      // 데이터 처리 로직
      const {
        HeartRateArr = [],
        MinBloodOxygenArr = [],
        MaxBloodOxygenArr = [],
        PressureArr = [],
        Sport = {},
      } = selectedRingData;

      const {
        TotalStepsArr = [],
        CalorieArr = [],
        WalkDistanceArr = [],
      } = Sport;

      // BPM 및 산소 데이터 처리
      const aggregatedBpmArr = HeartRateArr.filter((_, index) => index % 2 === 0);

      const timePoints = Array.from({ length: 24 * 12 }, (_, i) => {
        const hour = Math.floor(i / 12);
        const minute = (i % 12) * 5;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      });

      const bpmData = HeartRateArr.map((bpm, index) => ({
        time: timePoints[index],
        bpm: bpm || null,
      }));

      const oxygenData = MinBloodOxygenArr.map((minOxy, index) => {
        const avgOxy = MaxBloodOxygenArr[index]
          ? ((minOxy + MaxBloodOxygenArr[index]) / 2).toFixed(1)
          : minOxy;
        return {
          time: timePoints[index * 12], // 시간별 인덱스에 매핑
          oxygen: avgOxy || null,
        };
      });

      const mergedData = timePoints.map((time, index) => ({
        time,
        bpm: bpmData[index] ? bpmData[index].bpm : null,
        oxygen: oxygenData.find(o => o.time === time)?.oxygen || null,
      }));

      setLineChartData(mergedData);

      // 활동 데이터 처리
      const lastCalorie = getLastNonZero(CalorieArr);
      const lastDistance = getLastNonZero(WalkDistanceArr);

      const ringSteps = getLastNonZero(TotalStepsArr);
      const ringCalories = lastCalorie ? (lastCalorie / 1000).toFixed(2) : 0; // kcal
      const ringDistance = lastDistance ? (lastDistance / 1000).toFixed(2) : 0; // km
      const latestStress = getLastNonZero(PressureArr);

      setProcessedRingData({
        latestBpm: Number(getLastNonZero(aggregatedBpmArr)),
        averageOxygen: Number(((getLastNonZero(MinBloodOxygenArr) + getLastNonZero(MaxBloodOxygenArr)) / 2).toFixed(1)),
        steps: Number(ringSteps),
        calories: Number(ringCalories),
        distance: Number(ringDistance),
        stress: latestStress, 
      });
    } else {
      setLineChartData([]);
      setProcessedRingData({
        latestBpm: 0,
        averageOxygen: 0,
        steps: 0,
        calories: 0,
        distance: 0,
        stress: 0,
      });
    }
  }, [selectedRingData]);

  // 활동 라인 차트 데이터 준비
  useEffect(() => {
    if (selectedRingData?.Sport) {
      const { TotalStepsArr = [], CalorieArr = [], WalkDistanceArr = [] } = selectedRingData.Sport;
  
      const timePoints = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  
      let lastKnownData = { steps: 0, calories: 0, distance: 0 };
  
      const activityData = timePoints.map((time, index) => {
        let steps = lastKnownData.steps;
        let calories = lastKnownData.calories;
        let distance = lastKnownData.distance;
  
        if (TotalStepsArr[index] !== undefined) {
          steps = TotalStepsArr[index];
        }
        if (CalorieArr[index] !== undefined) {
          calories = CalorieArr[index] / 1000; // kcal
        }
        if (WalkDistanceArr[index] !== undefined) {
          distance = WalkDistanceArr[index]; // km
        }
  
        lastKnownData = { steps, calories, distance };
  
        return {
          time,
          steps,
          calories,
          distance,
        };
      });
  
      setActivityLineChartData(activityData);
    } else {
      setActivityLineChartData([]);
    }
  }, [selectedRingData]);

  // 사용자 변경 시 logItems 업데이트
  useEffect(() => {
    setLogItems(user?.lifeLogs || []);
  }, [user]);

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

      setIsEditModalOpen(false);
      setEditItem(null);
    }
  }, [editItem, logItems, user, updateUserLifeLog]);

  // Select All Checkbox Handler
  const handleSelectAllChange = useCallback((e) => {
    const isChecked = e.target.checked;
    const updatedItems = logItems.map((item) => ({ ...item, taken: isChecked }));
    setLogItems(updatedItems);

    // 업데이트된 user 객체 생성
    const updatedUser = {
      ...user,
      lifeLogs: updatedItems,
    };

    // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
    updateUserLifeLog(updatedUser, true);
  }, [logItems, updateUserLifeLog, user]);

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

  // Legend Items for BPM and Oxygen
  const bpmOxygenLegend = useMemo(() => [
    { dataKey: 'bpm', value: '심박수 (BPM)', color: 'red', show: showBpm, setShow: setShowBpm },
    { dataKey: 'oxygen', value: '혈중 산소포화도 (%)', color: '#1e88e5', show: showOxygen, setShow: setShowOxygen },
  ], [showBpm, showOxygen]);

  // Legend Items for Activity Data
  const activityLegend = useMemo(() => [
    { dataKey: 'steps', value: '걸음수', color: '#82ca9d', show: showSteps, setShow: setShowSteps },
    { dataKey: 'calories', value: '소모 칼로리 (kcal)', color: '#ff9800', show: showCalories, setShow: setShowCalories },
    { dataKey: 'distance', value: '이동거리 (km)', color: '#4caf50', show: showDistance, setShow: setShowDistance },
  ], [showSteps, showCalories, showDistance]);

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
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-lg"
            max={new Date().toISOString().split('T')[0]}
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
                <p><strong>연결 시간:</strong> {user.ring.ConnectedTime ? new Date(user.ring.ConnectedTime).toLocaleString() : 'N/A'}</p>
                <p><strong>배터리 수준:</strong> {user.ring.BatteryLevel !== undefined ? `${user.ring.BatteryLevel}%` : 'N/A'}</p>
              </div>
            </div>
          )}

          {/* 건강 정보 카드 */}
          <div className="info-boxes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <InfoCard icon={<FaHeartbeat className="text-red-500" />} title="심박수" value={`${processedRingData.latestBpm} BPM`} />
            <InfoCard icon={<FaTint className="text-blue-500" />} title="혈중 산소" value={`${processedRingData.averageOxygen}%`} />
            <InfoCard icon={<FaSmile className="text-yellow-500" />} title="스트레스" value={`${processedRingData.stress}점`} />            
            <InfoCard icon={<FaBed className="text-gray-500" />} title="수면 점수" value={`${processedSleep}점`} />
          </div>

          {/* 일별 데이터 선그래프 */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4">일별 데이터</h3>

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  ticks={xAxisTicks} 
                  interval={0} 
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
                    dot={false} // 점 숨기기
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
                    dot={false} // 점 숨기기
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 걸음수, 칼로리, 이동거리 정보 */}
          <div className="additional-info mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <InfoCard 
              icon={<FaWalking className="text-green-500" />} 
              title="걸음수" 
              value={`${processedRingData.steps} 걸음`} 
            />
            <InfoCard 
              icon={<FaFireAlt className="text-orange-500" />} 
              title="소모 칼로리" 
              value={`${processedRingData.calories.toFixed(2)} kcal`} 
            />
            <InfoCard 
              icon={<FaRoute className="text-blue-500" />} 
              title="이동거리" 
              value={`${processedRingData.distance.toFixed(2)} km`} 
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
                  interval={0} 
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
