// UserDetail.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaEdit, FaPlus, FaHeartbeat, FaBed, 
  FaSmile, FaTint, FaWalking, FaFireAlt, FaRoute,
  FaTemperatureHigh, FaArrowLeft
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import Modal from './Modal';
import CustomLegend from './CustomLegend';
import { calculateSleepScore } from './CalculateUserStatus';
import axios from 'axios';
import isEqual from 'lodash/isEqual'; // lodash의 isEqual 함수 사용
import 'react-datepicker/dist/react-datepicker.css';
import { RiHeartPulseLine, RiHeartPulseFill } from 'react-icons/ri';
import { FaExclamationTriangle } from 'react-icons/fa';

// 상수 데이터 정의 (컴포넌트 외부)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => 
  ['00', '30'].map(minute => ({
    value: `${String(hour).padStart(2, '0')}:${minute}`,
    label: `${String(hour).padStart(2, '0')}:${minute}`
  }))
).flat();

const BPM_OXYGEN_LEGEND_ITEMS = [
  { dataKey: 'bpm', value: '심박수 (BPM)', color: 'red' },
  { dataKey: 'oxygen', value: '혈중 산소 (%)', color: '#1e88e5' },
  { dataKey: 'stress', value: '스트레스 지수', color: '#FFD700' },
];

const ACTIVITY_LEGEND_ITEMS = [
  { dataKey: 'steps', value: '걸음수', color: '#82ca9d' },
  { dataKey: 'calories', value: '소모 칼로리 (kcal)', color: '#ff9800' },
  { dataKey: 'distance', value: '이동거리 (km)', color: '#4caf50' },
];

// 상수 데이터에 활력징후 범례 항목 추가
const VITAL_SIGNS_LEGEND_ITEMS = [
  { dataKey: 'temperature', value: '체온 (°C)', color: '#ff7300' },
  { dataKey: 'systolic', value: '수축기 혈압 (mmHg)', color: '#8884d8' },
  { dataKey: 'diastolic', value: '이완기 혈압 (mmHg)', color: '#82ca9d' },
];

// 위험 기준값 상수 추가
const VITAL_SIGNS_THRESHOLDS = {
  temperature: {
    high: 37.5,
    low: 35,
    normal: 36.5
  },
  systolic: {
    high: 140,
    low: 90,
    normal: 120
  },
  diastolic: {
    high: 90,
    low: 60,
    normal: 80
  },
  bpm: {
    high: 100,
    low: 60,
    normal: 80
  },
  oxygen: {
    high: 100,
    low: 90,
    normal: 98
  },
  stress: {
    high: 95,
    low: 0,
    normal: 50
  }
};

// 위험도에 따른 색상 결정 함수
const getLineColor = (value, type) => {
  if (!value || !VITAL_SIGNS_THRESHOLDS[type]) return null;
  const { high, low } = VITAL_SIGNS_THRESHOLDS[type];
  if (value > high) return '#ff4444';  // 높은 위험
  if (value < low) return '#ff9900';   // 낮은 위험
  return '#82ca9d';  // 정상
};

// CustomizedDot 컴포넌트 수정
const CustomizedDot = ({ cx, cy, value, dataKey, payload }) => {
  // value가 null, undefined 또는 0인 경우 dot을 표시하지 않음
  if (!value) return null;
  
  if (!VITAL_SIGNS_THRESHOLDS[dataKey]) return null;
  const { high, low } = VITAL_SIGNS_THRESHOLDS[dataKey];
  
  const getWarningMessage = () => {
    const type = {
      'temperature': '체온',
      'systolic': '수축기 혈압',
      'diastolic': '이완기 혈압',
      'bpm': '심박수',
      'oxygen': '혈중산소',
      'stress': '스트레스'
    }[dataKey];

    if (!type) return null;
    if (value > high) return `${type}이(가) 높습니다 (${value})`;
    if (value < low) return `${type}이(가) 낮습니다 (${value})`;
    return null;
  };

  const message = getWarningMessage();
  if (message) {
    return (
      <g transform={`translate(${cx-6},${cy-15})`}>
        <foreignObject width="120" height="40" x="-50" y="-40" style={{ pointerEvents: 'none' }}>
          <div className="bg-red-100 text-red-700 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {message}
          </div>
        </foreignObject>
        <circle cx="6" cy="15" r="2" fill="#ff4444" />
        <FaExclamationTriangle color="#ff4444" size={14} />
      </g>
    );
  }
  
  // 정상 범위일 경우 작은 점만 표시
  return <circle cx={cx} cy={cy} r="2" fill={getLineColor(value, dataKey) || '#82ca9d'} />;
};

// Helper Function to get the last non-zero value
const getLastNonZero = (arr = []) => {
  if (!Array.isArray(arr)) {
    console.warn('getLastNonZero: arr is not an array', arr);
    return 0;
  }
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== 0 && arr[i] !== null && !isNaN(arr[i])) {
      return arr[i];
    }
  }
  return 0;
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
  const { userId } = useParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [periodData, setPeriodData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempHealthData, setTempHealthData] = useState(null);
  const [isPast, setIsPast] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);  // 데이터 없음 상태 추가
  const [logItems, setLogItems] = useState([]);
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
  const [visibleBpmOxygen, setVisibleBpmOxygen] = useState({
    bpm: true,
    oxygen: true,
    stress: true,
  });
  const [visibleActivity, setVisibleActivity] = useState({
    steps: true,
    calories: true,
    distance: true,
  });
  const [visibleVitalSigns, setVisibleVitalSigns] = useState({
    temperature: true,
    systolic: true,
    diastolic: true,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // 활력징후 데이터 상태 추가
  const [vitalSignsData, setVitalSignsData] = useState([]);

  // 사용자 계산 via useMemo
  const user = useMemo(() => {
    if (users && Array.isArray(users)) {
      return users.find((u) => u.id === parseInt(userId)) || null;
    }
    return null;
  }, [users, userId]);

  const { data: userData = {} } = user || {};

  // 데이터 정규화 함수
  const normalizeData = useCallback((data) => {
    if (!data) return {};
    const normalized = {};
  
    Object.keys(data).forEach(key => {
      const lowerKey = key.toLowerCase();
      switch (lowerKey) {
        case 'heartratearr':
          normalized.heartratearr = Array.isArray(data[key]) ? data[key] : [];
          normalized.bpm = getLastNonZero(normalized.heartratearr);
          break;
        case 'bloodoxygenarr':
          normalized.oxygenarr = Array.isArray(data[key]) ? data[key] : [];
          normalized.oxygen = getLastNonZero(normalized.oxygenarr);
          break;
        case 'pressurearr':
          normalized.pressurearr = Array.isArray(data[key]) ? data[key] : [];
          normalized.stress = getLastNonZero(normalized.pressurearr);
          break;
        case 'sport':
          normalized.hourlyData = {
            calories: data[key].map(sport => sport.Calorie || 0),
            distance: data[key].map(sport => sport.WalkDistance || 0),
            steps: data[key].map(sport => sport.TotalSteps || 0),
          };
  
          normalized.steps = normalized.hourlyData.steps.at(-1) || 0;
          normalized.calories = normalized.hourlyData.calories.at(-1) || 0;
          normalized.distance = normalized.hourlyData.distance.at(-1) || 0;
          break;
        case 'hourlydata':
          normalized.hourlyData = {
            calories: Array.isArray(data[key].calories) ? data[key].calories : [],
            distance: Array.isArray(data[key].distance) ? data[key].distance : [],
            steps: Array.isArray(data[key].steps) ? data[key].steps : [],
          };
  
          // 마지막 값을 steps, calories, distance로 추가
          normalized.steps = normalized.hourlyData.steps.at(-1) || 0;
          normalized.calories = normalized.hourlyData.calories.at(-1) || 0;
          normalized.distance = normalized.hourlyData.distance.at(-1) || 0;
          break;
        default:
          normalized[lowerKey] = data[key];
      }
    });
  
    return normalized;
  }, []);
  
  // 날짜 형식 변환 함수들을 먼저 선언
  const formatDateYYYYMMDD = useCallback((date) => {
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateYYMMDD = useCallback((date) => {
    const year = String(date.getFullYear()).slice(-2);
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}${month}${day}`;
  }, []);

  // lifeLogs가 변경될 때 logItems 업데이트
  useEffect(() => {
    const lifeLogs = user?.lifeLogs || [];
    setLogItems(lifeLogs);
  }, [user?.lifeLogs]);

  // 일별 평균값 계산 함수
  const calculateDailyAverage = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const validValues = arr.filter(val => val !== 0);
    if (validValues.length === 0) return 0;
    return Math.round(validValues.reduce((sum, val) => sum + val, 0) / validValues.length);
  }, []);

  // 기간별 데이터 가져오기
  const fetchPeriodData = useCallback(async (period) => {
    try {
      setIsLoading(true);
      setError(null);

      const dateArray = [];
      const end = new Date();
      let start = new Date();

      // 기간에 따른 시작일 설정
      switch (period) {
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case '2weeks':
          start.setDate(end.getDate() - 14);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        default:
          break;
      }

      // 날짜 배열 생성
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dateArray.push(formatDateYYMMDD(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
      const url = 'https://api.ring.dotories.com';

      const healthDataPromises = dateArray.map(date =>
        axios.get(
          `${url}/api/user/health?siteId=${siteId}&userId=${userId}&yearMonthDay=${date}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credentials}`,
            },
          }
        ).catch(error => {
          console.log(`${date} 데이터 없음`);
          return { data: null }; // API 호출 실패 시 null 반환
        })
      );

      const responses = await Promise.all(healthDataPromises);
      const allHealthData = responses.map((response, index) => {
        let healthData = {};
        
        if (response.data) {
          const healthJson = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          healthData = healthJson.Data?.[0] || {};
        }

        return {
          date: dateArray[index],
          data: normalizeData(healthData)
        };
      });

      const processedData = allHealthData.map(dayData => ({
        date: dayData.date,
        bpm: calculateDailyAverage(dayData.data.heartratearr) || 0,
        oxygen: calculateDailyAverage(dayData.data.oxygenarr) || 0,
        stress: calculateDailyAverage(dayData.data.pressurearr) || 0,
        steps: dayData.data.steps || 0,
        calories: (dayData.data.calories || 0) / 1000, // M을 kcal로 변환
        distance: (dayData.data.distance || 0) / 1000, // m를 km로 변환
        temperature: dayData.data.temperature || 0,
        systolic: dayData.data.bloodPressure?.systolic || 0,
        diastolic: dayData.data.bloodPressure?.diastolic || 0
      }));

      setPeriodData(processedData);
      setSelectedPeriod(period);
    } catch (error) {
      console.error('Error fetching period data:', error);
      setError('기간별 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, siteId, formatDateYYMMDD, normalizeData, calculateDailyAverage]);

  // 기간 선택 핸들러
  const handlePeriodChange = useCallback((period) => {
    if (period === 'day') {
      setSelectedPeriod(period);
      setPeriodData(null);
    } else {
      fetchPeriodData(period);
    }
  }, [fetchPeriodData]);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((e) => {
    const dateString = e.target.value;
    const selected = new Date(dateString);
    setSelectedDate(selected);
    sessionStorage.setItem('selectedDate', dateString);
  }, []);

  // isToday 함수를 useCallback으로 메모이제이션
  const isToday = useCallback((someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
  }, []);

  const formatConnectedTime = useCallback((timeString) => {
    if (!timeString || timeString.length !== 12) {
      return 'Invalid format';
    }

    const year = `20${timeString.slice(0, 2)}`; // YY -> 20YY
    const month = parseInt(timeString.slice(2, 4), 10) - 1; // MM (0-indexed for JavaScript Date)
    const day = parseInt(timeString.slice(4, 6), 10); // DD
    const hours = parseInt(timeString.slice(6, 8), 10); // hh
    const minutes = parseInt(timeString.slice(8, 10), 10); // mm
    const seconds = parseInt(timeString.slice(10, 12), 10); // ss

    const date = new Date(year, month, day, hours, minutes, seconds);

    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  }, [isToday]);

  // Past data fetching
  const getPastData = useCallback(async (userId, date) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isToday(date)) {
        setIsPast(true);
        const formattedDate = formatDateYYMMDD(date);
        const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
        const url = 'https://api.ring.dotories.com';

        const healthResponse = await axios.get(
          `${url}/api/user/health?siteId=${siteId}&userId=${userId}&yearMonthDay=${formattedDate}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credentials}`,
            },
          }
        );

        const healthJson =
          typeof healthResponse.data === 'string'
            ? JSON.parse(healthResponse.data)
            : healthResponse.data;
        const healthDataArray = healthJson.Data || [];

        if (healthDataArray.length > 0) {
          const latestHealthData = healthDataArray[healthDataArray.length - 1] || {};
          const normalizedData = normalizeData(latestHealthData);
          if (Object.keys(normalizedData).length > 0) {
            setTempHealthData(normalizedData);
            setHasNoData(false);
          } else {
            setHasNoData(true);
          }
        } else {
          setHasNoData(true);
        }
      } else {
        setIsPast(false);
        if (Object.keys(userData || {}).length > 0) {
          const normalizedData = normalizeData(userData);
          if (Object.keys(normalizedData).length > 0) {
            setTempHealthData(normalizedData);
            setHasNoData(false);
          } else {
            setHasNoData(true);
          }
        } else {
          setHasNoData(true);
        }
      }
    } catch (error) {
      console.error('Error fetching past data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
      setHasNoData(true);
    } finally {
      setIsLoading(false);
    }
  }, [formatDateYYMMDD, siteId, isToday, normalizeData, userData]);

  useEffect(() => {
    if (userId && selectedDate) {
      getPastData(userId, selectedDate);
    }
  }, [userId, selectedDate, getPastData]);

  // Normalize currentHealthData
  const currentHealthData = useMemo(() => {
    const data = isPast ? tempHealthData : userData;
    const normalizedData = normalizeData(data) || {};
    return normalizedData;
  }, [isPast, tempHealthData, userData]);

  // Prepare data for 생체 신호 그래프
  const bioSignalChartData = useMemo(() => {
    if (!currentHealthData || Object.keys(currentHealthData).length === 0) {
      console.warn("currentHealthData is empty or undefined");
      return [];
    }

    const { heartratearr = [], oxygenarr = [], pressurearr = [] } = currentHealthData;

    // Precompute the data only when the health arrays change
    return Array.from({ length: 288 }, (_, i) => {
      const hour = Math.floor(i / 12);
      const minute = (i % 12) * 5;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      return {
        time,
        bpm: heartratearr[i] !== undefined && heartratearr[i] !== 0 ? heartratearr[i] : null,
        oxygen: Math.floor(i / 12) < oxygenarr.length
          ? (oxygenarr[Math.floor(i / 12)] !== 0 ? oxygenarr[Math.floor(i / 12)] : null)
          : null,
        stress: Math.floor(i / 6) < pressurearr.length
          ? (pressurearr[Math.floor(i / 6)] !== 0 ? pressurearr[Math.floor(i / 6)] : null)
          : null,
      };
    });
  }, [currentHealthData.heartratearr, currentHealthData.oxygenarr, currentHealthData.pressurearr]);

  // Prepare data for 활동 데이터 그래프
  const activityLineChartData = useMemo(() => {
    if (
      !currentHealthData ||
      !currentHealthData.hourlyData ||
      !Array.isArray(currentHealthData.hourlyData.calories) ||
      !Array.isArray(currentHealthData.hourlyData.distance) ||
      !Array.isArray(currentHealthData.hourlyData.steps) ||
      currentHealthData.hourlyData.calories.length !== 24 ||
      currentHealthData.hourlyData.distance.length !== 24 ||
      currentHealthData.hourlyData.steps.length !== 24
    ) {
      console.warn("Activity data is undefined, incomplete, or not in expected format");
      return [];
    }

    const { calories, distance, steps } = currentHealthData.hourlyData;

    return Array.from({ length: 24 }, (_, index) => ({
      time: `${String(index).padStart(2, '0')}:00`,
      steps: steps[index],
      calories: calories[index] / 1000,
      distance: distance[index] / 1000,
    }));
  }, [currentHealthData.hourlyData]);

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

    // 기존 logItems과 updatedItems가 다를 때만 업데이트
    if (!isEqual(logItems, updatedItems)) {
      setLogItems(updatedItems);

      // 업데이트된 user 객체 생성
      const updatedUser = {
        ...user,
        lifeLogs: updatedItems,
      };

      // 부모 컴포넌트의 상태 업데이트 및 서버로 전송
      updateUserLifeLog(updatedUser, true);
      console.log('Updated Life Logs after Checkbox Change:', updatedItems);
    }
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

    // 기존 logItems과 updatedLogItems가 다를 때만 업데이트
    if (!isEqual(logItems, updatedLogItems)) {
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
    }
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
      dose: dose, // '세부 사항'으 변경
    };

    const updatedItems = logItems.map((item) =>
      item.id === editItem.id ? updatedEditItem : item
    );

    // 기존 logItems과 updatedItems가 다를 때만 업데이트
    if (!isEqual(logItems, updatedItems)) {
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
    }
  }, [editItem, logItems, updateUserLifeLog, user]);

  // Delete Life Log Item Handler
  const handleDeleteItem = useCallback(() => {
    if (window.confirm('정말 이 Life 로그를 삭제하시겠습니까?')) {
      const updatedItems = logItems.filter(item => item.id !== editItem.id);

      // 기존 logItems과 updatedItems가 다를 때만 업데이트
      if (!isEqual(logItems, updatedItems)) {
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
  const xAxisTicks = useCallback(() => {
    return Array.from({ length: 12 }, (_, i) => { // 24/2 = 12
      const hour = i * 2;
      return `${String(hour).padStart(2, '0')}:00`;
    });
  }, []);

  // Legend Items for BPM, Oxygen, and Stress
  const bpmOxygenLegend = useMemo(() => 
    BPM_OXYGEN_LEGEND_ITEMS.map(item => ({
      ...item,
      show: visibleBpmOxygen[item.dataKey],
      toggle: () => setVisibleBpmOxygen(prev => ({
        ...prev,
        [item.dataKey]: !prev[item.dataKey],
      })),
    }))
  , [visibleBpmOxygen]);

  // Legend Items for Activity Data
  const activityLegend = useMemo(() => 
    ACTIVITY_LEGEND_ITEMS.map(item => ({
      ...item,
      show: visibleActivity[item.dataKey],
      toggle: () => setVisibleActivity(prev => ({
        ...prev,
        [item.dataKey]: !prev[item.dataKey],
      })),
    }))
  , [visibleActivity]);

  // Normalize logItems when lifeLogs changes
  useEffect(() => {
    const lifeLogs = user?.lifeLogs || [];
    if (!isEqual(lifeLogs, logItems)) {
      setLogItems(lifeLogs);
    }
  }, [user?.lifeLogs, logItems]);

  // 이제 bioSignalChartData를 정의한 후 로그를 출력합니다.
  console.log('bioSignalChartData:', bioSignalChartData);
  console.log('activityLineChartData:', activityLineChartData);

  // 컴포넌트 마운트 시 한 번만 랜덤 데이터 생성
  useEffect(() => {
    const newVitalSignsData = Array.from({ length: 144 }, (_, i) => {
      const hour = Math.floor(i / 6);
      const minute = (i % 6) * 10;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      // 체온 데이터는 실제 temperatureArr에서 가져옴
      const temperatureIndex = Math.floor(i * 2); // 10분 간격 데이터를 5분 간격으로 보간
      const temperature = user?.data?.temperatureArr?.[temperatureIndex];
      
      // 혈압 데이터도 실제 데이터에서 가져옴
      const systolic = user?.data?.bloodPressure?.systolicArr?.[temperatureIndex];
      const diastolic = user?.data?.bloodPressure?.diastolicArr?.[temperatureIndex];

      return {
        time,
        temperature: temperature && temperature !== 0 ? Number(temperature.toFixed(1)) : null,
        systolic: systolic && systolic !== 0 ? Number(systolic) : null,
        diastolic: diastolic && diastolic !== 0 ? Number(diastolic) : null,
      };
    });

    setVitalSignsData(newVitalSignsData);
  }, [user?.data]); // user.data가 변경될 때만 실행

  // 활력징후 범례 아이템 준비
  const vitalSignsLegend = useMemo(() => 
    VITAL_SIGNS_LEGEND_ITEMS.map(item => ({
      ...item,
      show: visibleVitalSigns[item.dataKey],
      toggle: () => setVisibleVitalSigns(prev => ({
        ...prev,
        [item.dataKey]: !prev[item.dataKey],
      })),
    }))
  , [visibleVitalSigns]);

  // 모바일 환경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 기간 설정 핸들러 추가
  const handleDateRangeSubmit = useCallback(() => {
    if (dateRange.startDate && dateRange.endDate) {
      setSelectedPeriod('custom');
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      // 기간별 데이터 가져오기
      const fetchCustomPeriodData = async () => {
        try {
          setIsLoading(true);
          const dateArray = [];
          let currentDate = new Date(start);
          
          while (currentDate <= end) {
            dateArray.push(formatDateYYMMDD(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }

          const credentials = btoa('Dotories:DotoriesAuthorization0312983335');
          const url = 'https://api.ring.dotories.com';

          const healthDataPromises = dateArray.map(date =>
            axios.get(
              `${url}/api/user/health?siteId=${siteId}&userId=${userId}&yearMonthDay=${date}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${credentials}`,
                },
              }
            ).catch(error => {
              console.log(`${date} 데이터 없음`);
              return { data: null }; // API 호출 실패 시 null 반환
            })
          );

          const responses = await Promise.all(healthDataPromises);
          const allHealthData = responses.map((response, index) => {
            let healthData = {};
            
            if (response.data) {
              const healthJson = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
              healthData = healthJson.Data?.[0] || {};
            }

            return {
              date: dateArray[index],
              data: normalizeData(healthData)
            };
          });

          const processedData = allHealthData.map(dayData => ({
            date: dayData.date,
            bpm: calculateDailyAverage(dayData.data.heartratearr) || 0,
            oxygen: calculateDailyAverage(dayData.data.oxygenarr) || 0,
            stress: calculateDailyAverage(dayData.data.pressurearr) || 0,
            steps: dayData.data.steps || 0,
            calories: (dayData.data.calories || 0) / 1000, // M을 kcal로 변환
            distance: (dayData.data.distance || 0) / 1000, // m를 km로 변환
            temperature: dayData.data.temperature || 0,
            systolic: dayData.data.bloodPressure?.systolic || 0,
            diastolic: dayData.data.bloodPressure?.diastolic || 0
          }));

          setPeriodData(processedData);
        } catch (error) {
          console.error('Error fetching custom period data:', error);
          setError('기간별 데이터를 불러오는데 실패했습니다.');
        } finally {
          setIsLoading(false);
          setIsDateRangeModalOpen(false);
        }
      };

      fetchCustomPeriodData();
    }
  }, [dateRange, userId, siteId, formatDateYYMMDD, normalizeData, calculateDailyAverage]);

  const { status, score: sleepScore } = useMemo(() => {
    if (!user || !user.data) return { status: 'normal', score: 0 };
    return calculateSleepScore({
      ...user,
      data: {
        ...user.data,
        sleepData: isPast ? tempHealthData?.sleepData : user.data?.sleepData
      }
    });
  }, [user, isPast, tempHealthData, user.data?.sleepData]);

  // userId가 변경될 때 데이터를 다시 불러오는 useEffect 수정
  useEffect(() => {
    if (userId) {
      if (selectedPeriod === 'custom' && dateRange.startDate && dateRange.endDate) {
        handleDateRangeSubmit();
      } else if (selectedPeriod && selectedPeriod !== 'day') {
        fetchPeriodData(selectedPeriod);
      }
    }
  }, [userId, selectedPeriod]);

  // 실시간 업데이트를 위한 interval 설정
  useEffect(() => {
    // 오늘 날짜이고, 데이터가 있고, 에러가 없는 경우에만 실시간 업데이트
    if (userId && selectedDate && isToday(selectedDate) && !error && !isPast && !hasNoData) {
      console.log('실시간 업데이트 시작');
      const intervalId = setInterval(() => {
        getPastData(userId, selectedDate);
      }, 30000);

      return () => {
        console.log('실시간 업데이트 중지');
        clearInterval(intervalId);
      };
    }
  }, [userId, selectedDate, getPastData, isToday, error, isPast, hasNoData]);

  return (
    <div className="p-4">
      {/* User Profile Header */}
      <div className="profile-header flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{user?.name || 'N/A'}</h2>
            <p className="text-gray-600"> &nbsp;&nbsp;&nbsp;{user?.age || 'N/A'}세</p>
            {/* 기간 정보 표시 추가 */}
            {selectedPeriod !== 'day' && periodData && periodData.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {periodData[0].date.slice(0, 2)}/{periodData[0].date.slice(2, 4)}/{periodData[0].date.slice(4, 6)} ~ 
                {periodData[periodData.length - 1].date.slice(0, 2)}/{periodData[periodData.length - 1].date.slice(2, 4)}/{periodData[periodData.length - 1].date.slice(4, 6)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <button
              onClick={() => {
                handlePeriodChange('day');
                setSelectedDate(new Date());
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1주일
            </button>
            <button
              onClick={() => handlePeriodChange('2weeks')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === '2weeks'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2주일
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1개월
            </button>
            <button
              onClick={() => setIsDateRangeModalOpen(true)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'custom'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              기간설정
            </button>
          </div>
          {/* 기간별 화면이 아닐 때만 날짜 선택 핸들러 표시 */}
          {selectedPeriod === 'day' && (
          <input
            type="date"
            value={formatDateYYYYMMDD(selectedDate)}
            onChange={handleDateChange}
            className="p-2 border border-gray-300 rounded-lg"
              max={formatDateYYYYMMDD(new Date())}
            aria-label="날짜 선택"
          />
          )}
        </div>
      </div>

      {/* 사용자 없을 경우 메시지 */}
      {!user && <p>사용자를 찾을 수 없습니다.</p>}

      {user && (
        <>
          {selectedPeriod === 'day' && hasNoData && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    선택하신 날짜({formatDateYYYYMMDD(selectedDate)})의 데이터가 없습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedPeriod === 'day' && !hasNoData && (
            <>
              {/* 링 정보 섹션 */}
              {user.ring && !isMobile && (
                <div className="ring-info bg-white p-4 rounded-lg shadow-md mb-6">
                  <h3 className="text-xl font-bold mb-4">링 정보</h3>
                  <div className="flex space-x-8 items-center">
                    <p><strong>이름:</strong> {user.ring.Name || 'N/A'}</p>
                    <p><strong>연결 시간:</strong> {user.ring.ConnectedTime ? formatConnectedTime(user.ring.ConnectedTime) : 'N/A'}</p>
                    <p><strong>배터리 수준:</strong> {user.ring.BatteryLevel !== undefined ? `${user.ring.BatteryLevel}%` : 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* 활력징후 카드 섹션 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard
                  icon={<FaTemperatureHigh className="text-orange-500" />}
                  title="체온"
                  value={`${getLastNonZero(user?.data?.temperatureArr || [])?.toFixed(1) || '0.0'}°C`}
                />
                <InfoCard
                  icon={<RiHeartPulseLine className="text-red-500" size={28} />}
                  title="수축기 혈압"
                  value={`${getLastNonZero(user?.data?.bloodPressure?.systolicArr || []) || 0} mmHg`}
                />
                <InfoCard
                  icon={<RiHeartPulseFill className="text-blue-500" size={28} />}
                  title="이완기 혈압"
                  value={`${getLastNonZero(user?.data?.bloodPressure?.diastolicArr || []) || 0} mmHg`}
                />
              </div>

              {/* 활력징후 그래프 */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">활력징후 모니터링</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={vitalSignsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="text-sm font-semibold mb-1">{label}</p>
                              {payload.map((entry, index) => {
                                if (entry.value === null || entry.value === undefined || isNaN(entry.value)) {
                                  return null;
                                }
                                return (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.name}: {
                                      entry.dataKey === 'temperature' ? entry.value.toFixed(1) :
                                      entry.dataKey === 'calories' ? Math.round(entry.value) :
                                      entry.dataKey === 'distance' ? entry.value.toFixed(1) :
                                      entry.value
                                    }
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {!isMobile && (
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        content={<CustomLegend legendItems={vitalSignsLegend} />}
                      />
                    )}
                    
                    {/* 기준선 추가 (라벨 제거) */}
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.temperature.high} stroke="#ff4444" strokeDasharray="3 3" />
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.temperature.low} stroke="#ff9900" strokeDasharray="3 3" />
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.systolic.high} stroke="#ff4444" strokeDasharray="3 3" />
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.systolic.low} stroke="#ff9900" strokeDasharray="3 3" />
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.diastolic.high} stroke="#ff4444" strokeDasharray="3 3" />
                    <ReferenceLine y={VITAL_SIGNS_THRESHOLDS.diastolic.low} stroke="#ff9900" strokeDasharray="3 3" />

                    {visibleVitalSigns.temperature && (
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ff7300"
                        name="체온 (°C)"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                      />
                    )}
                    {visibleVitalSigns.systolic && (
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        stroke="#8884d8"
                        name="수축기 혈압 (mmHg)"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    )}
                    {visibleVitalSigns.diastolic && (
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        stroke="#82ca9d"
                        name="이완기 혈압 (mmHg)"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 건강 정보 카드 */}
              <div className="info-boxes grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard
                  icon={<FaHeartbeat className="text-red-500" />}
                  title="심박수"
                  value={`${getLastNonZero(currentHealthData.heartratearr || [])} BPM`}
                />
                <InfoCard
                  icon={<FaTint className="text-blue-500" />}
                  title="혈중 산소"
                  value={`${currentHealthData.oxygen || 0}%`}
                />
                <InfoCard
                  icon={<FaSmile className="text-yellow-500" />}
                  title="스트레스"
                  value={`${currentHealthData.stress || 0} 점`}
                />
              </div>

              {/* 생체 신호 그래프 */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">생체신호</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={bioSignalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="text-sm font-semibold mb-1">{label}</p>
                              {payload.map((entry, index) => {
                                if (entry.value === null || entry.value === undefined || isNaN(entry.value)) {
                                  return null;
                                }
                                return (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.name}: {
                                      entry.dataKey === 'temperature' ? entry.value.toFixed(1) :
                                      entry.dataKey === 'calories' ? Math.round(entry.value) :
                                      entry.dataKey === 'distance' ? entry.value.toFixed(1) :
                                      entry.value
                                    }
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {!isMobile && (
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        content={<CustomLegend legendItems={bpmOxygenLegend} />}
                      />
                    )}
                    
                    {/* 생체신호 기준선 */}
                    {visibleBpmOxygen.bpm && (
                      <>
                        <ReferenceLine y={100} stroke="#ff4444" strokeDasharray="3 3" />
                        <ReferenceLine y={60} stroke="#ff9900" strokeDasharray="3 3" />
                      </>
                    )}
                    {visibleBpmOxygen.oxygen && (
                      <ReferenceLine y={95} stroke="#ff9900" strokeDasharray="3 3" />
                    )}
                    {visibleBpmOxygen.stress && (
                      <ReferenceLine y={95} stroke="#ff4444" strokeDasharray="3 3" />
                    )}

                    {visibleBpmOxygen.bpm && (
                      <Line
                        type="monotone"
                        dataKey="bpm"
                        stroke="red"
                        name="심박수 (BPM)"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                      />
                    )}
                    {visibleBpmOxygen.oxygen && (
                      <Line
                        type="monotone"
                        dataKey="oxygen"
                        stroke="#1e88e5"
                        name="혈중 산소 (%)"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                      />
                    )}
                    {visibleBpmOxygen.stress && (
                      <Line
                        type="monotone"
                        dataKey="stress"
                        stroke="#FFD700"
                        name="스트레스 지수"
                        dot={<CustomizedDot />}
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 걸음수, 소모 칼로리, 이동거리 정보 */}
              <div className="additional-info mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard 
                  icon={<FaWalking className="text-green-500" />} 
                  title="걸음수" 
                  value={`${currentHealthData.steps || 0} 걸음`} 
                />
                <InfoCard 
                  icon={<FaFireAlt className="text-orange-500" />} 
                  title="소모 칼로리" 
                  value={`${Math.round((currentHealthData.calories || 0) / 1000)} kcal`} 
                />
                <InfoCard 
                  icon={<FaRoute className="text-blue-500" />} 
                  title="이동거리" 
                  value={`${((currentHealthData.distance || 0) / 1000).toFixed(1)} km`} 
                />
              </div>

              {/* 활동 데이터 그래프 */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold mb-4">일일 활동량</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={activityLineChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p className="text-sm font-semibold mb-1">{label}</p>
                              {payload.map((entry, index) => {
                                if (entry.value === null || entry.value === undefined || isNaN(entry.value)) {
                                  return null;
                                }
                                return (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.name}: {
                                      entry.dataKey === 'temperature' ? entry.value.toFixed(1) :
                                      entry.dataKey === 'calories' ? Math.round(entry.value) :
                                      entry.dataKey === 'distance' ? entry.value.toFixed(1) :
                                      entry.value
                                    }
                                  </p>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {!isMobile && (
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        content={<CustomLegend legendItems={activityLegend} />}
                      />
                    )}
                    {visibleActivity.steps && (
                      <Line
                        type="monotone"
                        dataKey="steps"
                        stroke="#82ca9d"
                        name="걸음수"
                        dot={false}
                      />
                    )}
                    {visibleActivity.calories && (
                      <Line
                        type="monotone"
                        dataKey="calories"
                        stroke="#ff9800"
                        name="소모 칼로리 (kcal)"
                        dot={false}
                      />
                    )}
                    {visibleActivity.distance && (
                      <Line
                        type="monotone"
                        dataKey={(dataPoint) => dataPoint.distance}
                        stroke="#4caf50"
                        name="이동거리 (km)"
                        dot={false}
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
                      {TIME_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* 추가/닫기 버튼 */}
                    <div className="flex justify-end space-x-4">
                      <button
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                        onClick={handleAddItem}
                        aria-label="Life 로 추가 버튼"
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
                      aria-label="세 사항 수정 필드"
                    />

                    {/* 복용 시간 선택 */}
                    <label className="block mb-2">복용 시간</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 mb-4"
                      value={editItem.time}
                      onChange={(e) => setEditItem({ ...editItem, time: e.target.value })}
                      aria-label="복용 시간 수정 필드"
                    >
                      {TIME_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
                        aria-label="Life 그 저장 버튼"
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

          {selectedPeriod !== 'day' && (
            <>
              {/* 기간별 데이터 그래프 */}
              {periodData && (
                <>
                  {/* 기간별 활력징후 변화 그래프 */}
                  <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-bold mb-4">기간별 활력징후 변화</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={periodData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => `${value.slice(2, 4)}/${value.slice(4, 6)}`}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 16 }}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 6)}`}
                        />
                        {!isMobile && (
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            content={<CustomLegend legendItems={vitalSignsLegend} />}
                          />
                        )}
                        {visibleVitalSigns.temperature && (
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#ff7300"
                            name="체온 (°C)"
                            dot={<CustomizedDot />}
                            strokeWidth={2}
                          />
                        )}
                        {visibleVitalSigns.systolic && (
                          <Line
                            type="monotone"
                            dataKey="systolic"
                            stroke="#8884d8"
                            name="수축기 혈압 (mmHg)"
                            dot={<CustomizedDot />}
                            strokeWidth={2}
                            connectNulls={false}
                          />
                        )}
                        {visibleVitalSigns.diastolic && (
                          <Line
                            type="monotone"
                            dataKey="diastolic"
                            stroke="#82ca9d"
                            name="이완기 혈압 (mmHg)"
                            dot={<CustomizedDot />}
                            strokeWidth={2}
                            connectNulls={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 기간별 생체신호 변화 그래프 */}
                  <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-bold mb-4">기간별 생체신호 변화</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={periodData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => `${value.slice(2, 4)}/${value.slice(4, 6)}`}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 16 }}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 6)}`}
                        />
                        {!isMobile && (
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            content={<CustomLegend legendItems={bpmOxygenLegend} />}
                          />
                        )}
                        {visibleBpmOxygen.bpm && (
                          <Line
                            type="monotone"
                            dataKey="bpm"
                            stroke="red"
                            name="심박수 (BPM)"
                            dot={true}
                          />
                        )}
                        {visibleBpmOxygen.oxygen && (
                          <Line
                            type="monotone"
                            dataKey="oxygen"
                            stroke="#1e88e5"
                            name="혈중 산소 (%)"
                            dot={true}
                          />
                        )}
                        {visibleBpmOxygen.stress && (
                          <Line
                            type="monotone"
                            dataKey="stress"
                            stroke="#FFD700"
                            name="스트레스 지수"
                            dot={true}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 기간별 활동량 변화 그래프 추가 */}
                  <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-bold mb-4">기간별 활동량 변화</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={periodData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => `${value.slice(2, 4)}/${value.slice(4, 6)}`}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 16 }}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 6)}`}
                          formatter={(value, name) => {
                            if (name === "소모 칼로리 (kcal)" || name === "이동거리 (km)") {
                              return [value.toFixed(2), name];
                            }
                            return [value, name];
                          }}
                        />
                        {!isMobile && (
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            content={<CustomLegend legendItems={activityLegend} />}
                          />
                        )}
                        {visibleActivity.steps && (
                          <Line
                            type="monotone"
                            dataKey="steps"
                            stroke="#82ca9d"
                            name="걸음수"
                            dot={true}
                          />
                        )}
                        {visibleActivity.calories && (
                          <Line
                            type="monotone"
                            dataKey="calories"
                            stroke="#ff9800"
                            name="소모 칼로리 (kcal)"
                            dot={true}
                          />
                        )}
                        {visibleActivity.distance && (
                          <Line
                            type="monotone"
                            dataKey="distance"
                            stroke="#4caf50"
                            name="이동거리 (km)"
                            dot={true}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* 기간 설정 모달 */}
              {isDateRangeModalOpen && (
                <Modal onClose={() => setIsDateRangeModalOpen(false)}>
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4">기간 설정</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2">시작일</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          max={formatDateYYYYMMDD(new Date())}
                        />
                      </div>
                      <div>
                        <label className="block mb-2">종료일</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          max={formatDateYYYYMMDD(new Date())}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        onClick={handleDateRangeSubmit}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
                      >
                        확인
                      </button>
                      <button
                        onClick={() => setIsDateRangeModalOpen(false)}
                        className="bg-gray-500 text-white py-2 px-4 rounded-lg"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </Modal>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserDetail;
