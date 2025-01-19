// src/components/Card.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaEllipsisV, FaExchangeAlt, FaBrain } from 'react-icons/fa';
import {
  BarChart,
  ReferenceArea,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  LineChart,
  Line,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdDirectionsWalk,
  MdLocalFireDepartment,
  MdLocationOn
} from 'react-icons/md';
import '../App.css';
import { calculateUserStatus, calculateSleepScore } from './CalculateUserStatus';
import { PiSirenFill } from 'react-icons/pi';
import ThresholdModal from './ThresholdModal';


const Card = ({
  user,
  toggleFavorite,
  updateUser,
  deleteUser,
  availableRings,
  users,
  disconnectInterval,
  isExpanded
}) => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRingModal, setShowRingModal] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender);
  const [editedAge, setEditedAge] = useState(user.age);
  const [isRingConnected, setIsRingConnected] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);

  // **새로 추가된 상태**
  const [showRingDisconnectModal, setShowRingDisconnectModal] = useState(false);

  const menuRef = useRef(null);
  const modalRef = useRef(null);

  const OXYGEN_WARNING_THRESHOLD = 95;
  const OXYGEN_DANGER_THRESHOLD = 90;

  const [thresholds, setThresholds] = useState({
    heartRateWarningLow: user.thresholds?.heartRateWarningLow || 60,
    heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 100,
    heartRateDangerLow: user.thresholds?.heartRateDangerLow || 50,
    heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 110,
  });

  const { status, score: sleepScore } = useMemo(() => {
    return calculateUserStatus(user);
  }, [user]);

  useEffect(() => {
    setThresholds({
      heartRateWarningLow: user.thresholds?.heartRateWarningLow || 60,
      heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 100,
      heartRateDangerLow: user.thresholds?.heartRateDangerLow || 50,
      heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 110,
    });
  }, [user.thresholds]);

  const parseConnectedTime = useCallback((connectedTimeStr) => {
    // connectedTimeStr은 "YYMMDDhhmmss" 형식
    if (!connectedTimeStr || connectedTimeStr.length !== 12) {
      return null;
    }
    const year = parseInt(connectedTimeStr.slice(0, 2), 10) + 2000; // 2000년대 가정
    const month = parseInt(connectedTimeStr.slice(2, 4), 10) - 1; // 월은 0부터 시작
    const day = parseInt(connectedTimeStr.slice(4, 6), 10);
    const hour = parseInt(connectedTimeStr.slice(6, 8), 10);
    const minute = parseInt(connectedTimeStr.slice(8, 10), 10);
    const second = parseInt(connectedTimeStr.slice(10, 12), 10);

    const date = new Date(year, month, day, hour, minute, second);

    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }, []);

  useEffect(() => {
    const checkRingConnection = () => {
      if (user.ring && user.ring.ConnectedTime) {
        const connectedTime = parseConnectedTime(user.ring.ConnectedTime);
        if (connectedTime) {
          const currentTime = Date.now();
          const timeDiff = currentTime - connectedTime.getTime();
          if (timeDiff > disconnectInterval * 60 * 1000) {
            setIsRingConnected(false);
          } else {
            setIsRingConnected(true);
          }
        } else {
          setIsRingConnected(false);
        }
      } else {
        setIsRingConnected(false);
      }
    };

    checkRingConnection();

    const checkInterval = Math.max((disconnectInterval * 60 * 1000) / 5, 300 * 1000);

    const intervalId = setInterval(checkRingConnection, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [user.ring, disconnectInterval, parseConnectedTime]);

  // 데이터에서 마지막 0이 아닌 값을 추출하는 함수
  const getLastNonZero = useCallback((arr) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== 0) {
        return arr[i];
      }
    }
    return 0;
  }, []);

  // 시간대별 데이터에서 마지막 0이 아닌 값 추출
  const lastSteps = useMemo(() => getLastNonZero(user.data?.hourlyData?.steps || []), [user.data, getLastNonZero]);
  const lastCalories = useMemo(() => getLastNonZero(user.data?.hourlyData?.calories || []), [user.data, getLastNonZero]);
  const lastDistance = useMemo(() => getLastNonZero(user.data?.hourlyData?.distance || []), [user.data, getLastNonZero]);

  // 기존 총합 데이터를 제거하고, 마지막 값을 사용
  const processedSteps = lastSteps;
  const processedCalories = lastCalories;
  const processedDistance = lastDistance;

  const { bpm, oxygen, stress, sleep } = user.data || {
    bpm: 0,
    oxygen: 0,
    stress: 0,
    sleep: 0,
  };

  const STATUS_COLORS = {
    normal: '#4caf50', // 초록색
    warning: '#ff9800', // 노란색
    danger: '#f44336', // 빨간색
  };

  // 심박수 상태 계산 함수
  const getHeartRateStatus = useCallback(
    (value) => {
      if (value === 0) return 'normal';
      if (value >= thresholds.heartRateDangerHigh || value <= thresholds.heartRateDangerLow)
        return 'danger';
      if (value >= thresholds.heartRateWarningHigh || value <= thresholds.heartRateWarningLow)
        return 'warning';
      return 'normal';
    },
    [thresholds]
  );

  // 산소포화도 상태 계산 함수
  const getOxygenStatus = useCallback((value) => {
    if (value === 0) return 'normal';
    if (value < OXYGEN_DANGER_THRESHOLD) return 'danger';
    if (value < OXYGEN_WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }, []);

  // 체온 상태 계산 함수
  const getTemperatureStatus = useCallback((value) => {
    if (!value || value === 0) return 'normal';
    if (value < 35 || value > 38) return 'danger';
    if (value < 36 || value > 37.5) return 'warning';
    return 'normal';
  }, []);

  // 혈압 상태 계산 함수
  const getBloodPressureStatus = useCallback((systolic, diastolic) => {
    if (!systolic || !diastolic || systolic === 0 || diastolic === 0) return 'normal';
    if (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60) return 'danger';
    if (systolic > 130 || systolic < 100 || diastolic > 85 || diastolic < 65) return 'warning';
    return 'normal';
  }, []);

  // 수면 상태 계산 함수
  const getSleepStatus = useCallback((value) => {
    if (value === 0) return 'normal';
    if (value < 30) return 'danger';
    if (value < 50) return 'warning';
    return 'normal';
  }, []);

  const barChartData = [
    {
      name: '체온',
      xValue: 1,
      value: user.data?.temperature ? user.data.temperature : 0,
      status: getTemperatureStatus(user.data?.temperature),
      dangerLow: 35,
      warningLow: 36,
      warningHigh: 37.5,
      dangerHigh: 38,
    },
    {
      name: '혈압',
      xValue: 2,
      value: user.data?.bloodPressure?.systolic || 0,
      valueLow: user.data?.bloodPressure?.diastolic || 0,
      status: getBloodPressureStatus(
        user.data?.bloodPressure?.systolic,
        user.data?.bloodPressure?.diastolic
      ),
    },
    {
      name: '심박수',
      xValue: 3,
      value: bpm,
      status: getHeartRateStatus(bpm),
      dangerLow: thresholds.heartRateDangerLow,
      warningLow: thresholds.heartRateWarningLow,
      warningHigh: thresholds.heartRateWarningHigh,
      dangerHigh: thresholds.heartRateDangerHigh,
    },
    {
      name: '산소',
      xValue: 4,
      value: oxygen,
      status: getOxygenStatus(oxygen),
      dangerLow: OXYGEN_DANGER_THRESHOLD,
      warningLow: OXYGEN_WARNING_THRESHOLD,
      warningHigh: 100,
      dangerHigh: 100,
    },
    {
      name: '수면',
      xValue: 5,
      value: sleepScore,
      status: getSleepStatus(sleepScore),
      dangerLow: 30,
      warningLow: 50,
      warningHigh: 80,
      dangerHigh: 100,
    },
  ];

  const openThresholdModal = useCallback(
    (e) => {
      e.stopPropagation();
      setThresholds({
        heartRateWarningLow: user.thresholds?.heartRateWarningLow || 80,
        heartRateWarningHigh: user.thresholds?.heartRateWarningHigh || 120,
        heartRateDangerLow: user.thresholds?.heartRateDangerLow || 70,
        heartRateDangerHigh: user.thresholds?.heartRateDangerHigh || 140,
      });
      setShowThresholdModal(true);
      setMenuOpen(false);
    },
    [user]
  );

  const navigateToUserDetail = useCallback(() => {
    if (!showThresholdModal && !showEditModal && !showDeleteModal && !showRingModal) {
      navigate(`/users/${user.id}`);
    }
  }, [navigate, user.id, showThresholdModal, showEditModal, showDeleteModal, showRingModal]);

  const toggleMenu = useCallback(
    (e) => {
      e.stopPropagation();
      setMenuOpen((prev) => !prev);
    },
    []
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (
        (showEditModal || showThresholdModal || showDeleteModal || showRingModal) &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        event.stopPropagation();
        // 모달 닫기 로직은 각각의 onClose 핸들러에서 처리
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditModal, showThresholdModal, showDeleteModal, showRingModal]);


  const renderCustomLabel = useCallback((props) => {
    const { x, y, width, value, name } = props;
    
    if (value !== 0 && value != null) {
      const getValueWithUnit = () => {
        if (['스트레스', '산소'].includes(name)) return `${value}%`;
        if (name === '체온') return `${value}°C`;
        if (name === '수면' && value === 0) return '';
        if (name === '수면') return `${value}점`;
        return value;
      };
  
      return (
        <text
          x={x + width / 2}
          y={name === '혈압' ? y - 13 : y - 8}
          fill="#000"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {getValueWithUnit()}
        </text>
      );
    }
    return null;
  }, []);

  // **새로 추가된 링 변경 핸들러**
  const handleRingChangeClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (user.ring && user.ring.MacAddr) {
        // 링이 연결된 사용자일 경우 링 해제 확인 모달 표시
        setShowRingDisconnectModal(true);
      } else {
        // 링이 연결되지 않은 사용자일 경우 DeviceManagement 페이지로 이동하면서 사용자 전달
        navigate('/devices', { 
          state: { 
            selectedUser: user,
            userName: user.name
          } 
        });
      }
    },
    [user, navigate]
  );

  // 클릭 핸들러 추가
  const handleClick = () => {
    if (clickTimeout === null) {
      setClickTimeout(
        setTimeout(() => {
          updateUser(user, !isExpanded);
          setClickTimeout(null);
        }, 200)
      );
    }
  };

  // 더블 클릭 핸들러 추가
  const handleDoubleClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    navigate(`/users/${user.id}`);
  };

  // 컴포넌트 언마운트 시 타임아웃 클리어
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const [vitalSignsData] = useState(() => {
    return Array.from({ length: 288 }, (_, i) => {
      const hour = Math.floor(i / 12);
      const baseTemp = 36.5;
      const fourHourBlock = Math.floor(hour / 4);
      const tempVariation = Math.sin(fourHourBlock * Math.PI / 3) * 0.3;
      const temp = baseTemp + tempVariation;

      const baseSystolic = 120;
      const baseDiastolic = 80;
      const bpVariation = Math.sin((fourHourBlock - 1.5) * Math.PI / 3) * 10;
      const systolic = baseSystolic + bpVariation;
      const diastolic = baseDiastolic + (bpVariation * 0.6);

      return {
        temp: Number(temp.toFixed(1)),
        bp_sys: Math.round(systolic),
        bp_dia: Math.round(diastolic)
      };
    });
  });

  const chartData = useMemo(() => {
    return Array.from({ length: 288 }, (_, i) => {
      const hour = Math.floor(i / 12);
      const minute = (i % 12) * 5;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // 심박수 데이터 (5분 간격)
      const heartRate = user.data?.heartRateArr?.[i] || null;
      
      // 산소포화도 데이터 (1시간 간격)
      const oxygenIndex = Math.floor(i / 12);
      const oxygen = user.data?.oxygenArr?.[oxygenIndex] || null;

      // 수면 데이터 처리
      let sleepState = null;
      let sleepStateLabel = null;
      const sleepBeans = user.data?.sleepData?.sleepBeans || [];
      const currentTimeStr = `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;
      
      const currentSleepBean = sleepBeans.find(bean => {
        const startTime = bean.StartTime.slice(-6);
        const endTime = bean.EndTime.slice(-6);
        return currentTimeStr >= startTime && currentTimeStr <= endTime;
      });

      if (currentSleepBean) {
        switch(currentSleepBean.SleepType) {
          case 0: 
            sleepState = 20;  // 깊은 수면을 아래로
            sleepStateLabel = '깊은 수면';
            break;
          case 1: 
            sleepState = 80;  // 얕은 수면을 위로
            sleepStateLabel = '얕은 수면';
            break;
          case 2: 
            sleepState = 60;  // REM 수면은 중간 위쪽으로
            sleepStateLabel = 'REM 수면';
            break;
          case 3: 
            sleepState = 100;  // 각성은 가장 위로
            sleepStateLabel = '각성';
            break;
        }
      }

      return {
        time,
        heart: heartRate !== 0 ? heartRate : null,
        oxygen: oxygen !== 0 ? oxygen : null,
        sleep: sleepState,
        sleepLabel: sleepStateLabel,
        temp: user.data?.temperature || null,
        bp_sys: user.data?.bloodPressure?.systolic || null,
        bp_dia: user.data?.bloodPressure?.diastolic || null
      };
    });
  }, [user.data]);

  return (
    <div
      className={`card p-4 rounded-lg shadow-md bg-white cursor-pointer ${
        status === 'warning' ? 'border-4 border-yellow-500' : 
        status === 'danger' ? 'border-4 border-red-500' : ''
      } transition-all duration-300 ease-in-out`}
      style={{
        fontFamily: 'Nanum Gothic, sans-serif',
        height: '400px',
        maxWidth: isExpanded ? '1140px' : '380px',
        minWidth: '320px',
        maxHeight: '450px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        position: isExpanded ? 'fixed' : 'relative',
        left: isExpanded ? '50%' : 'auto',
        right: isExpanded ? 'auto' : 'auto',
        top: isExpanded ? '50%' : 'auto',
        transform: isExpanded ? 'translate(-50%, -50%)' : 'none',
        width: isExpanded ? '1140px' : 'auto',
        zIndex: isExpanded ? '9999' : '1',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="absolute top-2 right-2 flex items-center" ref={menuRef}>
        {status === 'danger' && (
          <PiSirenFill
            className="text-red-500 animate-blink mr-2"
            size={22}
            aria-label="위험 상태 알람"
          />
        )}
        <button
          style={{
            padding: '5px',
            marginRight: '5px',
            borderRadius: '80%',
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(user.id);
          }}
        >
          <FaStar
            className={`mr-1 ${user.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
            size={20}
          />
        </button>
        <button
          style={{
            padding: '5px',
            marginRight: '5px',
            borderRadius: '80%',
          }}
          onClick={handleRingChangeClick}
          aria-label="링 변경"
        >
          <FaExchangeAlt
            className={`mr-1 ${user.ring && user.ring.MacAddr ? 'text-blue-500' : 'text-gray-400'}`}
            size={20}
          />
        </button>
        <button onClick={toggleMenu} aria-label="메뉴 보기">
          <FaEllipsisV size={20} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-50">
            <button
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={openThresholdModal}
            >
              심박수 위험지수 수정
            </button>
          </div>
        )}
      </div>

      <div className="card-header mb-4">
        <h2 className="font-bold text-lg">
          {user.name} ({user.gender === 0 ? '남성' : '여성'}, {user.age})
        </h2>
        <p className="text-sm text-gray-600">
          {user.ring ? `연결된 링: ${user.ring.Name || '없음'}` : '링 없음'}
          {isExpanded && (
            <span className="ml-4">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} 
            </span>
          )}
        </p>
      </div>

      {isExpanded ? (
        <div className="expanded-view h-[calc(100%-120px)]">
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                animationDuration={300}
                animationBegin={0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  interval={23}
                  tickFormatter={(value) => value.split(':')[0]}
                  axisLine={{ stroke: '#f0f0f0' }}
                  tickLine={true}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left"
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  axisLine={{ stroke: '#f0f0f0' }}
                  tickLine={true}
                />
                
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="text-sm font-bold">{label}</p>
                          {payload.map((entry, index) => {
                            if (entry.dataKey === 'sleep' && entry.value !== null) {
                              return (
                                <p key={index} style={{ color: entry.color }}>
                                  수면 상태: {chartData.find(d => d.time === label)?.sleepLabel || '없음'}
                                </p>
                              );
                            }
                            return (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#ff7300" 
                  name="체온" 
                  dot={false} 
                  isAnimationActive={false}
                  strokeWidth={1.5}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="bp_sys" 
                  stroke="#8884d8" 
                  name="수축기 혈압" 
                  dot={false} 
                  isAnimationActive={false}
                  strokeWidth={1.5}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="bp_dia" 
                  stroke="#82ca9d" 
                  name="이완기 혈압" 
                  dot={false} 
                  isAnimationActive={false}
                  strokeWidth={1.5}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="heart" 
                  stroke="#ff4444" 
                  name="심박수" 
                  dot={false} 
                  isAnimationActive={false}
                  strokeWidth={1.5}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="oxygen" 
                  stroke="#1e88e5" 
                  name="산소포화도" 
                  dot={false} 
                  isAnimationActive={false}
                  strokeWidth={1.5}
                />
                <Line 
                  yAxisId="left" 
                  type="stepAfter" 
                  dataKey="sleep" 
                  stroke="#9c27b0" 
                  name="수면 상태" 
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              {
                name: '체온',
                xValue: 1,
                value: user.data?.temperature ? user.data.temperature : 0,
                status: getTemperatureStatus(user.data?.temperature),
                dangerLow: 35,
                warningLow: 36,
                warningHigh: 37.5,
                dangerHigh: 38,
              },
              {
                name: '혈압',
                xValue: 2,
                value: user.data?.bloodPressure?.systolic || 0,
                valueLow: user.data?.bloodPressure?.diastolic || 0,
                status: getBloodPressureStatus(
                  user.data?.bloodPressure?.systolic,
                  user.data?.bloodPressure?.diastolic
                ),
              },
              {
                name: '심박수',
                xValue: 3,
                value: bpm,
                status: getHeartRateStatus(bpm),
                dangerLow: thresholds.heartRateDangerLow,
                warningLow: thresholds.heartRateWarningLow,
                warningHigh: thresholds.heartRateWarningHigh,
                dangerHigh: thresholds.heartRateDangerHigh,
              },
              {
                name: '산소',
                xValue: 4,
                value: oxygen,
                status: getOxygenStatus(oxygen),
                dangerLow: OXYGEN_DANGER_THRESHOLD,
                warningLow: OXYGEN_WARNING_THRESHOLD,
                warningHigh: 100,
                dangerHigh: 100,
              },
              {
                name: '수면',
                xValue: 5,
                value: sleepScore,
                status: getSleepStatus(sleepScore),
                dangerLow: 30,
                warningLow: 50,
                warningHigh: 80,
                dangerHigh: 100,
              },
            ]}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis
              dataKey="xValue"
              type="number"
              xAxisId="x"
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => {
                const entry = barChartData.find((item) => item.xValue === value);
                return entry ? entry.name : '';
              }}
              domain={[0.5, 5.5]}
              allowDuplicatedCategory={false}
            />
            <YAxis 
              domain={[0, 180]} 
              ticks={[0, 30, 60, 90, 120, 150, 180]} 
              tickFormatter={(value) => {
                return value;
              }}
            />

            {/* ReferenceArea에 마진 적용 */}
            {barChartData.map((entry, index) => (
              <React.Fragment key={`reference-${index}`}>
                {(() => {
                  const margin = 0.2;
                  return (
                    <>
                      {entry.name !== '스트레스' && (
                        <>
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={0}
                            y2={entry.name === '혈압' ? 90 : entry.dangerLow}
                            xAxisId="x"
                            fill="#f44336"
                            fillOpacity={0.2}
                          />
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={entry.name === '혈압' ? 90 : entry.dangerLow}
                            y2={entry.name === '혈압' ? 100 : entry.warningLow}
                            xAxisId="x"
                            fill="#ff9800"
                            fillOpacity={0.2}
                          />
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={entry.name === '혈압' ? 100 : entry.warningLow}
                            y2={entry.name === '혈압' ? 130 : (entry.warningHigh || entry.warningLow)}
                            xAxisId="x"
                            fill="#4caf50"
                            fillOpacity={0.2}
                          />
                          {(entry.warningHigh || entry.name === '혈압') && (
                            <ReferenceArea
                              x1={entry.xValue - 0.5 + margin}
                              x2={entry.xValue + 0.5 - margin}
                              y1={entry.name === '혈압' ? 130 : entry.warningHigh}
                              y2={entry.name === '혈압' ? 140 : entry.dangerHigh}
                              xAxisId="x"
                              fill="#ff9800"
                              fillOpacity={0.2}
                            />
                          )}
                          {(entry.dangerHigh || entry.name === '혈압') && (
                            <ReferenceArea
                              x1={entry.xValue - 0.5 + margin}
                              x2={entry.xValue + 0.5 - margin}
                              y1={entry.name === '혈압' ? 140 : entry.dangerHigh}
                              y2={180}
                              xAxisId="x"
                              fill="#f44336"
                              fillOpacity={0.2}
                            />
                          )}
                        </>
                      )}

                      {entry.name === '스트레스' && (
                        <>
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={0}
                            y2={entry.warningLow}
                            xAxisId="x"
                            fill="#4caf50"
                            fillOpacity={0.2}
                          />
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={34}
                            y2={66}
                            xAxisId="x"
                            fill="#ff9800"
                            fillOpacity={0.2}
                          />
                          <ReferenceArea
                            x1={entry.xValue - 0.5 + margin}
                            x2={entry.xValue + 0.5 - margin}
                            y1={67}
                            y2={180}
                            xAxisId="x"
                            fill="#f44336"
                            fillOpacity={0.2}
                          />
                        </>
                      )}
                    </>
                  );
                })()}
              </React.Fragment>
            ))}

            {/* 실제 값 표시를 위한 Bar */}
            <Bar 
              dataKey={(data) => {
                if (data.name === '혈압' && data.valueLow) {
                  return data.value;  // 수축기 값 그대로 반환
                }
                if (data.name === '체온') {
                  return data.value;  // 체온 실제 값 그대로 반환
                }
                return data.value;
              }} 
              isAnimationActive={false} 
              xAxisId="x" 
              barSize={30}
              shape={(props) => {
                const { fill, x, width, y, height } = props;
                if (props.payload.name === '혈압' && props.payload.valueLow) {
                  const maxValue = 180;  // Y축 최대값
                  const minValue = 10;   // Y축 최소값
                  const chartHeight = 160;  // 실제 차트 높이
                  const startY = chartHeight - (chartHeight * (props.payload.valueLow - minValue) / (maxValue - minValue));  // 이완기 위치
                  const endY = chartHeight - (chartHeight * (props.payload.value - minValue) / (maxValue - minValue));  // 수축기 위치
                  
                  return (
                    <rect 
                      x={x} 
                      y={endY}  // 수축기 위치(위쪽)
                      width={width} 
                      height={startY - endY}  // 이완기 위치까지의 높이
                      fill={fill} 
                    />
                  );
                }
                return <rect x={x} y={y} width={width} height={height} fill={fill} />;
              }}
            >
              {barChartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status]}
                />
              ))}
              <LabelList
                dataKey={(data) => {
                  if (data.name === '혈압' && data.valueLow) {
                    return `${data.value}/${data.valueLow}`;
                  }
                  if (data.name === '체온') {
                    return `${(data.value).toFixed(1)}`;
                  }
                  return data.value;
                }}
                position={(data) => data.name === '혈압' ? 'top' : 'inside'}
                offset={data => data.name === '혈압' ? 10 : 0}
                content={renderCustomLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card-footer mt-4 grid grid-cols-4 gap-2 text-center text-sm p-2 bg-gray-100 rounded-md">
        {[
          {
            icon: <MdDirectionsWalk size={24} color="#3b82f6" />,
            label: '걸음수',
            value: `${processedSteps}보`,
          },
          {
            icon: <MdLocalFireDepartment size={24} color="#ff5722" />,
            label: '칼로리',
            value: `${(processedCalories / 1000).toFixed(0)} kcal`,
          },
          {
            icon: <MdLocationOn size={24} color="#4caf50" />,
            label: '이동거리',
            value: `${(processedDistance / 1000).toFixed(2)} km`,
          },
          {
            icon: <FaBrain size={24} color="#9c27b0" />,
            label: '스트레스',
            value: `${user.data?.stress || 0}점`,
          },
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-center">
              {item.icon}
            <span className="text-xs text-gray-600">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
        </>
      )}

      {showThresholdModal && (
        <ThresholdModal
          thresholds={thresholds}
          setThresholds={setThresholds}
          user={user}
          updateUser={updateUser}
          setShowThresholdModal={setShowThresholdModal}
          modalRef={modalRef}
        />
      )}
    </div>
  );
};

export default Card;
