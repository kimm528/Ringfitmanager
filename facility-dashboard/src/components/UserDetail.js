import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FaEdit, FaPlus, FaHeartbeat, FaBed, 
  FaSmile, FaTint, FaWalking, FaFireAlt, FaRoute 
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import Modal from './Modal';
import CustomLegend from './CustomLegend';

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

const UserDetail = ({ users, updateUserLifeLog }) => {
  const { userId } = useParams();  // Get userId from URL
  const user = useMemo(() => users.find((u) => u.id === parseInt(userId)), [users, userId]);

  // Destructure user data with default values
  const {
    bpm = 0,
    oxygen = 0,
    stress = 0,
    sleep = 0,
    lifeLogs = [],
  } = user?.data || {};

  // State variables
  const [logItems, setLogItems] = useState(lifeLogs || []);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Use Date object
  const [sortOption, setSortOption] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    medicine: '',
    date: '',
    dose: '',
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

  // Static Weekly Exercise Data (Memoized)
  const weekExerciseData = useMemo(() => [
    { day: '월', score: 79, date: '9/1' },
    { day: '화', score: 65, date: '9/2' },
    { day: '수', score: 100, date: '9/3' },
    { day: '목', score: 72, date: '9/4' },
    { day: '금', score: 78, date: '9/5' },
    { day: '토', score: 100, date: '9/6' },
    { day: '일', score: 100, date: '9/7' },
  ], []);

  // Fetch ring data by date
  const fetchRingDataByDate = useCallback(async (date, userMacAddr) => { 
    try {
      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      
      // Format date to 'YYMMDD'
      const year = String(date.getFullYear()).slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}${month}${day}`; // e.g., '240930'

      console.log(`Fetching ring data for formattedDate: ${formattedDate} and macAddr: ${userMacAddr}`);

      // Include MAC address in query parameters
      const ringUrl = `https://fitlife.dotories.com/api/ring?siteId=Dotories&yearMonthDay=${formattedDate}&macAddr=${userMacAddr}`;

      const response = await axios.get(ringUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
      });
      
      if (response.status !== 200) {
        throw new Error(`API response error: ${response.status}`);
      }
      
      const dataIndex = response.data.Data.findIndex(
        (item) => item.MacAddr === userMacAddr
      );

      const fetchedData = response.data.Data[dataIndex];
      return fetchedData;
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return null;
    }
  }, []);

  // Handle date change
  const handleDateChange = useCallback((e) => {
    const dateString = e.target.value;
    const selected = new Date(dateString);
    setSelectedDate(selected);
  }, []);

  // Fetch ring data when selectedDate or user changes
  useEffect(() => {
    if (user && selectedDate) {
      const userMacAddr = user?.ring?.MacAddr;

      if (!userMacAddr) {
        console.error('User MAC address not found.');
        return;
      }

      fetchRingDataByDate(selectedDate, userMacAddr).then((data) => {
        if (data) {
          setSelectedRingData(data);
        } else {
          setSelectedRingData(null);
        }
      });
    }
  }, [selectedDate, user, fetchRingDataByDate]);

  // Process selectedRingData when it changes
  useEffect(() => {
    if (selectedRingData) {
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

      // Process BPM and Oxygen data
      const aggregatedBpmArr = HeartRateArr.filter((_, index) => index % 2 === 0);

      const timePoints = Array.from({ length: 24 * 6 }, (_, i) => {
        const hour = Math.floor(i / 6);
        const minute = (i % 6) * 10;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      });

      const bpmData = aggregatedBpmArr.map((bpm, index) => ({
        time: timePoints[index],
        bpm: bpm || null,
      }));

      const oxygenData = MinBloodOxygenArr.map((minOxy, index) => {
        const avgOxy = MaxBloodOxygenArr[index]
          ? ((minOxy + MaxBloodOxygenArr[index]) / 2).toFixed(1)
          : minOxy;
        return {
          time: timePoints[index * 6],
          oxygen: avgOxy || null,
        };
      });

      const latestStress = getLastNonZero(PressureArr);
      const mergedData = timePoints.map((time, index) => ({
        time,
        bpm: bpmData[index] ? bpmData[index].bpm : null,
        oxygen: oxygenData.find(o => o.time === time)?.oxygen || null,
      }));

      setLineChartData(mergedData);

      // Process activity data
      const ringSteps = getLastNonZero(TotalStepsArr);
      const ringCalories = (getLastNonZero(CalorieArr) / 1000).toFixed(2); // kcal
      const ringDistance = (getLastNonZero(WalkDistanceArr) / 1000).toFixed(2); // km

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

  // Prepare activity line chart data
  useEffect(() => {
    if (selectedRingData?.Sport) {
      const { TotalStepsArr, CalorieArr, WalkDistanceArr } = selectedRingData.Sport;

      const timePoints = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

      let lastKnownData = { steps: 0, calories: 0, distance: 0 };

      const activityData = timePoints.map((time, index) => {
        if (TotalStepsArr[index] !== undefined || CalorieArr[index] !== undefined || WalkDistanceArr[index] !== undefined) {
          lastKnownData = {
            steps: TotalStepsArr[index] || lastKnownData.steps,
            calories: (CalorieArr[index] || lastKnownData.calories) / 1000, // kcal
            distance: (WalkDistanceArr[index] || lastKnownData.distance) / 1000, // km
          };
        }
        return {
          time,
          steps: lastKnownData.steps,
          calories: lastKnownData.calories,
          distance: lastKnownData.distance,
        };
      });

      setActivityLineChartData(activityData);
    } else {
      setActivityLineChartData([]);
    }
  }, [selectedRingData]);

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
    updateUserLifeLog(user.id, updatedItems);
  }, [logItems, updateUserLifeLog, user]);

  // Add Modal Toggle
  const toggleAddModal = useCallback(() => {
    setIsAddModalOpen(prev => !prev);
  }, []);

  // Open Edit Modal
  const openEditModal = useCallback((item) => {
    setEditItem({
      ...item,
      dose: item.dose.endsWith('정') ? item.dose.slice(0, -1) : item.dose,
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
      dose: `${dose}정`,
      id: logItems.length > 0 ? Math.max(...logItems.map(item => item.id || 0)) + 1 : 1,
    };

    const updatedLogItems = [...logItems, newLogItem];
    setLogItems(updatedLogItems);
    updateUserLifeLog(user.id, updatedLogItems);
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
      dose: `${dose}정`,
    };

    const updatedItems = logItems.map((item) =>
      item.id === editItem.id ? updatedEditItem : item
    );

    setLogItems(updatedItems);
    updateUserLifeLog(user.id, updatedItems);
    setIsEditModalOpen(false);
    setEditItem(null);
  }, [editItem, logItems, updateUserLifeLog, user]);

  // Select All Checkbox Handler
  const handleSelectAllChange = useCallback((e) => {
    const isChecked = e.target.checked;
    const updatedItems = logItems.map((item) => ({ ...item, taken: isChecked }));
    setLogItems(updatedItems);
    updateUserLifeLog(user.id, updatedItems);
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
    { dataKey: 'distance', value: '이동거리 (km)', color: '#4caf50', show: showDistance, setShow: setShowDistance }, // 단위 변경: km
  ], [showSteps, showCalories, showDistance]);
  return (
    <div className="p-4">
      {/* User Profile Header */}
      <div className="profile-header flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
            <img src={user?.profileImage || '/default-profile.png'} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{user?.name || 'N/A'}</h2>
            <p className="text-gray-600">{user?.age || 'N/A'}세</p>
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-lg"
            max={new Date().toISOString().split('T')[0]}
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
                <p><strong>연결 시간:</strong> {new Date(user.ring.ConnectedTime).toLocaleString()}</p>
                <p><strong>배터리 수준:</strong> {user.ring.BatteryLevel}%</p>
              </div>
            </div>
          )}

          {/* 건강 정보 카드 */}
          <div className="info-boxes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <InfoCard icon={<FaHeartbeat className="text-red-500" />} title="심박수" value={`${processedRingData.latestBpm} BPM`} />
            <InfoCard icon={<FaTint className="text-blue-500" />} title="혈중 산소" value={`${processedRingData.averageOxygen}%`} />
            <InfoCard icon={<FaSmile className="text-yellow-500" />} title="스트레스" value={`${processedRingData.stress}점`} />            
            <InfoCard icon={<FaBed className="text-gray-500" />} title="수면 점수" value={`${sleep}점`} />
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

          {/* 주간 운동 섹션 */}
          <div className="weekly-exercise bg-white p-4 rounded-lg shadow-md mt-6 relative">
            <h3 className="text-xl font-bold mb-4">주간 운동</h3>
            <div className="flex justify-end mb-2">
              <FaEdit className="text-gray-500 cursor-pointer" title="운동 점수 수정" />
            </div>
            <div className="grid grid-cols-7 gap-2 justify-between">
              {weekExerciseData.map((item) => (
                <div key={item.date} className="flex flex-col items-center">
                  <PieChart width={80} height={80}>
                    <Pie
                      data={[
                        { name: '점수', value: item.score },
                        { name: '나머지', value: 100 - item.score },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={35}
                      stroke="none"
                      dataKey="value"
                    >
                      <Cell key={`cell-${item.date}`} fill="#0088FE" />
                    </Pie>
                    <text 
                      x="50%" 
                      y="50%" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      className="text-blue-500 font-bold"
                    >
                      {item.score}%
                    </text>
                  </PieChart>
                  <div className="text-center mt-1">
                    <div className="font-bold text-gray-800">{item.day}</div>
                    <div className="text-sm text-gray-500">{item.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Life 로그 섹션 */}
          <div className="life-log bg-white p-4 rounded-lg shadow-md mt-6">
            <h3 className="text-xl font-bold mb-4">Life 로그</h3>
            <div className="flex justify-between items-center mb-4">
              <select
                value={sortOption}
                onChange={(e) => handleSort(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg"
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
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-center">복용</th> {/* 새 체크박스 헤더 */}
                    <th className="p-2">복용약</th>
                    <th className="p-2">처방일</th>
                    <th className="p-2">처방 개수</th>
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
                      <td className="p-2">{item.dose || 'N/A'}</td>
                      <td className="p-2">{item.time || 'N/A'}</td>
                      <td className="p-2">
                        {item.id !== 'empty-1' && item.id !== null ? (
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="수정"
                          >
                            <FaEdit size={20} />
                          </button>
                        ) : null}
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
                />

                {/* 처방일 입력 */}
                <label className="block mb-2">처방일</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={newItem.date}
                  onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                />

                {/* 처방 개수 입력 */}
                <label className="block mb-2">처방 개수</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  placeholder="처방 개수 입력"
                  value={newItem.dose}
                  onChange={(e) => setNewItem({ ...newItem, dose: e.target.value })}
                />

                {/* 복용 시간 선택 */}
                <label className="block mb-2">복용 시간</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={newItem.time}
                  onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
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
                  >
                    추가
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg"
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
                />

                {/* 처방일 입력 */}
                <label className="block mb-2">처방일</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.date}
                  onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                />

                {/* 처방 개수 입력 */}
                <label className="block mb-2">처방 개수</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.dose}
                  onChange={(e) => setEditItem({ ...editItem, dose: e.target.value })}
                />

                {/* 복용 시간 선택 */}
                <label className="block mb-2">복용 시간</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                  value={editItem.time}
                  onChange={(e) => setEditItem({ ...editItem, time: e.target.value })}
                >
                  {Array.from({ length: 24 }, (_, i) =>
                    ['00', '30'].map((minute) => (
                      <option key={`${i}:${minute}`} value={`${String(i).padStart(2, '0')}:${minute}`}>
                        {`${String(i).padStart(2, '0')}:${minute}`}
                      </option>
                    ))
                  )}
                </select>

                {/* 저장/닫기 버튼 */}
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                    onClick={handleSaveEditItem}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg"
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
