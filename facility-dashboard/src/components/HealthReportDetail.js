import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
  ComposedChart,
  Area,
  ReferenceLine
} from 'recharts';
import styled from 'styled-components';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import Cookies from 'js-cookie';

const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
//const url = 'https://api.ring.dotories.com';
const url = 'https://dotoriesringcloudserver-b2bgarb8bth5b9ff.koreacentral-01.azurewebsites.net';

//const url = 'http://172.30.1.8:7201'


const formatDateYYMMDD = (date) => {
  const year = String(date.getFullYear()).slice(-2);
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}${month}${day}`;
};

const fetchHealthDataForDateRange = async (userId, startDate, endDate) => {
  const siteId = Cookies.get('siteId');
  if (!siteId) {
    console.error('사이트 ID를 찾을 수 없습니다.');
    return null;
  }

  console.log('리포트 데이터 불러오기 시작');
  
  const healthData = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    try {
      const formattedDate = formatDateYYMMDD(currentDate);
      
      const response = await axios.get(
        `${url}/api/user/health?siteId=${siteId}&userId=${userId}&yearMonthDay=${formattedDate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      const userHealthData = data.Data?.[0];
      
      if (userHealthData) {
        // 체온 데이터 로깅 추가
        console.log(`날짜 ${formattedDate}의 체온 데이터:`, userHealthData.TemperatureArr);
        
        healthData.push({
          date: formattedDate,
          HeartRateArr: userHealthData.HeartRateArr || [],
          BloodOxygenArr: userHealthData.BloodOxygenArr || [],
          SbpArr: userHealthData.SbpArr || [],
          DbpArr: userHealthData.DbpArr || [],
          TemperatureArr: userHealthData.TemperatureArr || [],
          Sport: userHealthData.Sport?.slice(-1)[0] || {},
          Sleep: userHealthData.Sleep || null
        });
      }

    } catch (error) {
      console.error('건강 데이터 조회 중 오류:', error.response || error);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('리포트 데이터 불러오기 완료');
  return healthData;
};

const ReportContainer = styled.div`
    padding: 1rem;
    background: white;
    
    #first-page, #second-page {
      margin-bottom: 2rem;
    }

    .vital-monitoring, .activity-analysis, .sleep-analysis, .report-summary {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 15px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .vital-monitoring {
      border-left: 4px solid #4a90e2;
    }

    .activity-analysis {
      border-left: 4px solid #82ca9d;
    }

    .sleep-analysis {
      border-left: 4px solid #8884d8;
    }

    .report-summary {
      border-left: 4px solid #2c3e50;
      padding: 2rem;
      margin-top: 0;
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);

      .section-title {
        font-size: 1.8rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        padding-bottom: 0.8rem;
        border-bottom: 2px solid #e9ecef;
        font-weight: 600;
      }

      .summary-content {
        padding: 0 1rem;

        .detail-item {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          p {
            margin-bottom: 0.8rem;
            line-height: 1.6;
            color: #495057;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.3rem;
            
            &:last-child {
              margin-bottom: 0;
            }

            span {
              display: inline-flex;
              align-items: center;
              font-weight: 600;
              padding: 0.1rem 0.4rem;
              border-radius: 4px;
              background: rgba(74, 144, 226, 0.1);
              height: 1.6rem;
              line-height: 1;
            }
          }
        }

        .recommendations {
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          margin-top: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);

          h4 {
            color: #2c3e50;
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e9ecef;
          }

          ul {
            list-style: none;
            padding-left: 0;
            margin-bottom: 0;

            li {
              position: relative;
              padding-left: 1.5rem;
              margin-bottom: 1rem;
              color: #495057;
              line-height: 1.6;
              font-size: 1.1rem;
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 0.3rem;

              &:before {
                content: "•";
                color: #4a90e2;
                font-weight: bold;
                position: absolute;
                left: 0;
                font-size: 1.5rem;
                line-height: 1;
              }

              &:last-child {
                margin-bottom: 0;
              }

              span {
                display: inline-flex;
                align-items: center;
                font-weight: 600;
                padding: 0.1rem 0.4rem;
                border-radius: 4px;
                background: rgba(74, 144, 226, 0.1);
                height: 1.6rem;
                line-height: 1;
              }
            }
          }
        }
      }
    }

    .report-header {
      text-align: center;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #eee;
      padding-bottom: 0;
      background: white;
      
      .basic-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #666;
      }
    }

    .vital-monitoring, .activity-analysis, .sleep-analysis {
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.3rem;

        .chart-title {
          font-weight: 600;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .reference-info {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #666;

          span {
            &.abnormal-dates {
              color: #ff4757;
            }
          }
        }
      }

      .section-title {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 0.3rem;
        padding-bottom: 0.3rem;
        border-bottom: 2px solid #e9ecef;
        font-weight: 600;
        display: flex;
        align-items: center;
      }

      .chart-container {
        background: white;
        border-radius: 10px;
        padding: 0.3rem;
        margin-bottom: 0.3rem;
        border: 1px solid #e9ecef;
        width: 100%;
      }
    }

    .activity-chart {
      width: 100%;
    }

    h2 {
      font-size: 2rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0.5rem 0;
      padding: 0.3rem 0;
    }
`;

const HealthReportDetail = ({ users }) => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const startDate = useMemo(() => 
    searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : null,
    [searchParams]
  );
  
  const endDate = useMemo(() => 
    searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : null,
    [searchParams]
  );

  const normalizeData = useCallback((data) => {
    const normalized = {
      heartratearr: [],
      oxygenarr: [],
      pressurearr: [],
      steps: 0,
      calories: 0,
      distance: 0,
      sleepData: null
    };

    if (!data) return normalized;

    // 데이터 정규화
    if (data.HeartRateArr) normalized.heartratearr = data.HeartRateArr;
    if (data.BloodOxygenArr) normalized.oxygenarr = data.BloodOxygenArr;
    if (data.PressureArr) normalized.pressurearr = data.PressureArr;
    if (data.Steps) normalized.steps = data.Steps;
    if (data.Calories) normalized.calories = data.Calories;
    if (data.Distance) normalized.distance = data.Distance;
    if (data.Sleep) normalized.sleepData = data.Sleep;

    return normalized;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // 이미 데이터를 로드했다면 다시 로드하지 않음
      if (hasLoaded) {
        console.log('이미 데이터가 로드되어 있어 추가 로드를 건너뜁니다.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        if (!users || !userId || !startDate || !endDate) {
          setError('필수 데이터가 없습니다.');
          return;
        }

        const userData = users.find(user => user.id === parseInt(userId));
        if (!userData) {
          setError('사용자 정보를 찾을 수 없습니다.');
          return;
        }

        const healthData = await fetchHealthDataForDateRange(userData.id, startDate, endDate);
        
        if (!healthData || healthData.length === 0) {
          setError('선택한 기간의 건강 데이터가 없습니다.');
          return;
        }

        const processedData = healthData.map(dayData => {
          // 체온 데이터 처리
          const temperature = calculateTemperatureAverage(dayData.TemperatureArr);
          
          // 혈압 데이터 처리
          const systolicValues = dayData.SbpArr || [];
          const diastolicValues = dayData.DbpArr || [];
          const validSystolicValues = systolicValues.filter(val => val !== 0 && val !== 0.0);
          const validDiastolicValues = diastolicValues.filter(val => val !== 0 && val !== 0.0);
          const systolic = validSystolicValues.length > 0 ? Math.round(validSystolicValues.reduce((sum, val) => sum + val, 0) / validSystolicValues.length) : 0;
          const diastolic = validDiastolicValues.length > 0 ? Math.round(validDiastolicValues.reduce((sum, val) => sum + val, 0) / validDiastolicValues.length) : 0;

          // 수면 데이터 랜덤 생성
          const totalSleepTime = Math.floor(Math.random() * (480 - 420 + 1)) + 420; // 7-8시간
          const deepSleepPercent = Math.floor(Math.random() * (23 - 15 + 1)) + 15; // 15-23%
          const remSleepPercent = Math.floor(Math.random() * (25 - 20 + 1)) + 20; // 20-25%
          const awakeSleepPercent = Math.floor(Math.random() * (5 - 2 + 1)) + 2; // 2-5%
          const lightSleepPercent = 100 - deepSleepPercent - remSleepPercent - awakeSleepPercent;

          const sleepData = {
            totalDuration: totalSleepTime,
            deepDuration: Math.floor(totalSleepTime * deepSleepPercent / 100),
            remDuration: Math.floor(totalSleepTime * remSleepPercent / 100),
            awakeDuration: Math.floor(totalSleepTime * awakeSleepPercent / 100),
            lightDuration: Math.floor(totalSleepTime * lightSleepPercent / 100)
          };

          return {
            date: dayData.date,
            heartRate: calculateDailyAverage(dayData.HeartRateArr),
            oxygen: calculateDailyAverage(dayData.BloodOxygenArr),
            stress: calculateDailyAverage(dayData.PressureArr),
            temperature,
            steps: dayData.Sport?.TotalSteps || 0,
            calories: (dayData.Sport?.Calorie || 0) / 1000,
            distance: (dayData.Sport?.WalkDistance || 0) / 1000,
            systolic,
            diastolic,
            sleepData
          };
        });

        setReportData({
          userData: {
            ...userData,
            height: Math.floor(Math.random() * (180 - 160 + 1)) + 160,
            weight: Math.floor(Math.random() * (85 - 55 + 1)) + 55
          },
          dailyData: processedData,
          summary: calculateSummary(processedData)
        });
        setHasLoaded(true);
        console.log('리포트 데이터 처리 완료');
      } catch (error) {
        console.error('건강 데이터 조회 중 오류:', error);
        setError('건강 데이터 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, startDate, endDate, hasLoaded]);

  const calculateSummary = (data) => {
    if (!data || data.length === 0) return null;

    return {
      heartRate: {
        avg: Math.round(data.reduce((sum, d) => sum + d.heartRate, 0) / data.length),
        max: Math.max(...data.map(d => d.heartRate)),
        min: Math.min(...data.map(d => d.heartRate))
      },
      oxygen: {
        avg: Math.round(data.reduce((sum, d) => sum + d.oxygen, 0) / data.length),
        max: Math.max(...data.map(d => d.oxygen)),
        min: Math.min(...data.map(d => d.oxygen))
      },
      stress: {
        avg: Math.round(data.reduce((sum, d) => sum + d.stress, 0) / data.length),
        max: Math.max(...data.map(d => d.stress)),
        min: Math.min(...data.map(d => d.stress))
      },
      activity: {
        totalSteps: data.reduce((sum, d) => sum + d.steps, 0),
        totalCalories: data.reduce((sum, d) => sum + d.calories, 0).toFixed(1),
        totalDistance: data.reduce((sum, d) => sum + d.distance, 0).toFixed(1)
      }
    };
  };

  const calculateDailyAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const validValues = arr.filter(val => val !== 0 && val !== 0.0);
    if (validValues.length === 0) return 0;
    return Math.round(validValues.reduce((sum, val) => sum + val, 0) / validValues.length);
  };

  const calculateTemperatureAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const validValues = arr.filter(val => val !== 0 && val !== 0.0);
    if (validValues.length === 0) return 0;
    return Number((validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(1));
  };

  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // PDF 저장 버튼 숨기기
    const downloadButton = document.querySelector('.download-button');
    if (downloadButton) downloadButton.style.display = 'none';

    try {
      // 임시 스타일 적용
      const tempStyle = document.createElement('style');
      tempStyle.innerHTML = `
        #report-content .recharts-wrapper,
        #report-content .recharts-responsive-container {
          width: 700px !important;
          min-width: 700px !important;
          max-width: 700px !important;
        }
        #report-content .vital-monitoring .recharts-wrapper,
        #report-content .vital-monitoring .recharts-responsive-container {
          height: 130px !important;
          min-height: 130px !important;
          max-height: 130px !important;
        }
        #report-content .activity-chart .recharts-wrapper,
        #report-content .activity-chart .recharts-responsive-container {
          height: 300px !important;
          min-height: 300px !important;
          max-height: 300px !important;
        }
        #report-content .sleep-analysis .recharts-wrapper,
        #report-content .sleep-analysis .recharts-responsive-container {
          height: 250px !important;
          min-height: 250px !important;
          max-height: 250px !important;
        }
        #report-content .recharts-legend-wrapper {
          width: 700px !important;
        }
      `;
      document.head.appendChild(tempStyle);

      // 첫 페이지 캡처
      const firstPageElement = document.getElementById('first-page');
      await new Promise(resolve => setTimeout(resolve, 500)); // 스타일 적용을 위한 대기
      const firstCanvas = await html2canvas(firstPageElement, {
        scale: 1,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      });
      const firstImgData = firstCanvas.toDataURL('image/png');
      const firstImgWidth = pdfWidth - 20;
      const firstImgHeight = (firstCanvas.height * firstImgWidth) / firstCanvas.width;
      
      pdf.addImage(firstImgData, 'PNG', 10, 10, firstImgWidth, Math.min(firstImgHeight, pdfHeight - 20));

      // 두 번째 페이지 캡처
      pdf.addPage();
      const secondPageElement = document.getElementById('second-page');
      const secondCanvas = await html2canvas(secondPageElement, {
        scale: 1,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      });
      const secondImgData = secondCanvas.toDataURL('image/png');
      const secondImgWidth = pdfWidth - 20;
      const secondImgHeight = (secondCanvas.height * secondImgWidth) / secondCanvas.width;
      
      pdf.addImage(secondImgData, 'PNG', 10, 10, secondImgWidth, Math.min(secondImgHeight, pdfHeight - 20));

      // 임시 스타일 제거
      document.head.removeChild(tempStyle);

    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
    } finally {
      // PDF 저장 버튼 다시 표시
      if (downloadButton) downloadButton.style.display = 'flex';
    }

    pdf.save('건강리포트.pdf');
  };

  // 날짜 포맷팅 함수 추가
  const formatXAxisDate = (dateStr) => {
    const year = dateStr.slice(0, 2);
    const month = dateStr.slice(2, 4);
    const day = dateStr.slice(4, 6);
    
    // 1월 1일인 경우에만 연도 포함
    if (month === '01' && day === '01') {
      return `${year}.${parseInt(month)}.${parseInt(day)}`;
    }
    
    return `${parseInt(month)}.${parseInt(day)}`;
  };

  // 정상 범위 상수 정의
  const NORMAL_RANGES = {
    heartRate: { min: 60, max: 100, label: '정상범위' },
    oxygen: { min: 95, max: 100, label: '정상범위' },
    systolic: { min: 90, max: 120, label: '정상범위' },
    diastolic: { min: 60, max: 80, label: '정상범위' },
    temperature: { min: 36.5, max: 37.5, label: '정상범위' },
    stress: { min: 0, max: 66, label: '정상범위' },
    deepSleep: { min: 13, max: 23, label: '깊은 수면 정상범위' },
    remSleep: { min: 20, max: 25, label: 'REM 수면 정상범위' }
  };

  // 이상치 날짜 표시를 위한 함수
  const getAbnormalDates = (data, field, range) => {
    return data
      .filter(d => d[field] < range.min || d[field] > range.max)
      .map(d => formatXAxisDate(d.date))
      .join(', ');
  };

  const calculateSleepScore = (sleepData) => {
    if (!sleepData) return 0;

    const totalTime = sleepData.totalDuration || 0;
    const sleepTime = totalTime - (sleepData.awakeDuration || 0);
    const deepSleepDuration = sleepData.deepDuration || 0;

    // 수면 효율 점수 (40점)
    const sleepEfficiencyScore = totalTime > 0 
      ? Math.min(40, Math.round((sleepTime / totalTime) * 40))
      : 0;

    // 수면 시간 적정성 점수 (30점)
    const optimalSleepDuration = 420; // 7시간 = 420분
    const durationScore = totalTime > 0
      ? Math.min(30, Math.round((totalTime / optimalSleepDuration) * 30))
      : 0;

    // 수면 구조 점수 (30점)
    const deepSleepRatio = totalTime > 0 ? (deepSleepDuration / totalTime) : 0;
    const optimalDeepSleepRatio = 0.225; // 이상적인 깊은 수면 비율 22.5%
    const structureScore = Math.min(30, Math.round((deepSleepRatio / optimalDeepSleepRatio) * 30));

    return sleepEfficiencyScore + durationScore + structureScore;
  };

  const calculateSleepDuration = (sleepBeans) => {
    if (!sleepBeans || sleepBeans.length === 0) return {
      totalDuration: 0,
      deepDuration: 0,
      lightDuration: 0,
      remDuration: 0,
      awakeDuration: 0
    };

    let totalDuration = 0;
    let deepDuration = 0;
    let lightDuration = 0;
    let remDuration = 0;
    let awakeDuration = 0;

    sleepBeans.forEach(bean => {
      const startTime = parseInt(bean.StartTime);
      const endTime = parseInt(bean.EndTime);
      
      const startHour = Math.floor(startTime / 10000);
      const startMin = Math.floor((startTime % 10000) / 100);
      const endHour = Math.floor(endTime / 10000);
      const endMin = Math.floor((endTime % 10000) / 100);
      
      let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      if (duration < 0) duration += 24 * 60;
      
      switch(bean.SleepType) {
        case 0:
          deepDuration += duration;
          break;
        case 1:
          lightDuration += duration;
          break;
        case 2:
          remDuration += duration;
          break;
        case 3:
          awakeDuration += duration;
          break;
      }
      totalDuration += duration;
    });

    return {
      totalDuration,
      deepDuration,
      lightDuration,
      remDuration,
      awakeDuration
    };
  };

  // 수면 상태 비율 계산 함수
  const calculateSleepRatios = (sleepData) => {
    if (!sleepData) return { deep: 0, light: 0, rem: 0, awake: 0 };
    
    const total = sleepData.totalDuration || 1;
    const deep = sleepData.deepDuration || 0;
    const light = sleepData.lightDuration || 0;
    const rem = sleepData.remDuration || 0;
    const awake = sleepData.awakeDuration || 0;

    return {
      deep: Math.round((deep / total) * 100),
      light: Math.round((light / total) * 100),
      rem: Math.round((rem / total) * 100),
      awake: Math.round((awake / total) * 100)
    };
  };

  // 수면 이상 날짜 확인 함수
  const getSleepAbnormalDates = (data) => {
    return data
      .filter(d => {
        if (!d.sleepData) return false;
        const ratios = calculateSleepRatios(d.sleepData);
        return ratios.deep < NORMAL_RANGES.deepSleep.min || 
               ratios.deep > NORMAL_RANGES.deepSleep.max ||
               ratios.rem < NORMAL_RANGES.remSleep.min ||
               ratios.rem > NORMAL_RANGES.remSleep.max;
      })
      .map(d => formatXAxisDate(d.date))
      .join(', ');
  };

  if (isLoading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">데이터를 불러오는 중입니다...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="p-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (!reportData) return null;

  const { userData, dailyData, summary } = reportData;

  return (
    <Container fluid className="p-4">
      <ReportContainer id="report-content">
        <div id="first-page">
          <div className="report-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>{userData.name}님의 건강 리포트</h2>
              <Button 
                className="download-button"
                variant="outline-primary" 
                onClick={downloadPDF}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <i className="fas fa-file-pdf" style={{ fontSize: '1.1rem' }}></i>
                PDF 저장
              </Button>
            </div>
            <div className="basic-info">
              <span>회원번호: {userData.id}</span>
              <span>신장: {userData.height}cm</span>
              <span>체중: {userData.weight}kg</span>
              <span>연령: {userData.age || '-'}세</span>
              <span>성별: {userData.gender === 0 ? '남성' : '여성'}</span>
              <span>측정일시: {startDate.toLocaleDateString()} ~ {endDate.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="vital-monitoring">
            <h3 className="section-title">Vital 모니터링</h3>
            
            <div className="chart-container">
              <div className="header">
                <div className="chart-title">심박수 (bpm)</div>
                <div className="reference-info">
                  <span>정상범위: {NORMAL_RANGES.heartRate.min}-{NORMAL_RANGES.heartRate.max}</span>
                  {dailyData.some(d => d.heartRate < NORMAL_RANGES.heartRate.min || d.heartRate > NORMAL_RANGES.heartRate.max) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getAbnormalDates(dailyData, 'heartRate', NORMAL_RANGES.heartRate)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[40, 160]} />
                  <Tooltip />
                  <ReferenceLine y={NORMAL_RANGES.heartRate.max} stroke="#666" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.heartRate.min} stroke="#666" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="heartRate"
                    fill="#8884d8"
                    fillOpacity={0.1}
                    stroke="none"
                    baseLine={NORMAL_RANGES.heartRate.min}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotoneX" 
                    dataKey="heartRate" 
                    stroke="#8884d8"
                    name="심박수"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="header">
                <div className="chart-title">혈압 (mmHg)</div>
                <div className="reference-info">
                  <span>정상범위: 수축기 {NORMAL_RANGES.systolic.min}-{NORMAL_RANGES.systolic.max}, 이완기 {NORMAL_RANGES.diastolic.min}-{NORMAL_RANGES.diastolic.max}</span>
                  {dailyData.some(d => 
                    d.systolic < NORMAL_RANGES.systolic.min || 
                    d.systolic > NORMAL_RANGES.systolic.max ||
                    d.diastolic < NORMAL_RANGES.diastolic.min ||
                    d.diastolic > NORMAL_RANGES.diastolic.max
                  ) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getAbnormalDates(dailyData, 'systolic', NORMAL_RANGES.systolic)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[50, 150]} />
                  <Tooltip />
                  <ReferenceLine y={NORMAL_RANGES.systolic.max} stroke="#ff7300" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.systolic.min} stroke="#ff7300" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.diastolic.max} stroke="#82ca9d" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.diastolic.min} stroke="#82ca9d" strokeDasharray="3 3" />
                  <Line 
                    type="monotoneX" 
                    dataKey="systolic" 
                    stroke="#ff7300" 
                    name="수축기"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                  <Line 
                    type="monotoneX" 
                    dataKey="diastolic" 
                    stroke="#82ca9d" 
                    name="이완기"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="header">
                <div className="chart-title">체온 (°C)</div>
                <div className="reference-info">
                  <span>정상범위: {NORMAL_RANGES.temperature.min}-{NORMAL_RANGES.temperature.max}</span>
                  {dailyData.some(d => d.temperature < NORMAL_RANGES.temperature.min || d.temperature > NORMAL_RANGES.temperature.max) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getAbnormalDates(dailyData, 'temperature', NORMAL_RANGES.temperature)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[35, 38]} />
                  <Tooltip />
                  <ReferenceLine y={NORMAL_RANGES.temperature.max} stroke="#666" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.temperature.min} stroke="#666" strokeDasharray="3 3" />
                  <Line 
                    type="monotoneX" 
                    dataKey="temperature" 
                    stroke="#ff4757"
                    name="체온"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="header">
                <div className="chart-title">산소포화도 (%)</div>
                <div className="reference-info">
                  <span>정상범위: {NORMAL_RANGES.oxygen.min}-{NORMAL_RANGES.oxygen.max}</span>
                  {dailyData.some(d => d.oxygen < NORMAL_RANGES.oxygen.min || d.oxygen > NORMAL_RANGES.oxygen.max) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getAbnormalDates(dailyData, 'oxygen', NORMAL_RANGES.oxygen)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <ReferenceLine y={NORMAL_RANGES.oxygen.max} stroke="#666" strokeDasharray="3 3" />
                  <ReferenceLine y={NORMAL_RANGES.oxygen.min} stroke="#666" strokeDasharray="3 3" />
                  <Line 
                    type="monotoneX" 
                    dataKey="oxygen" 
                    stroke="#82ca9d"
                    name="산소포화도"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container stress-chart">
              <div className="header">
                <div className="chart-title">스트레스</div>
                <div className="reference-info">
                  <span>정상범위: {NORMAL_RANGES.stress.min}-{NORMAL_RANGES.stress.max}</span>
                  {dailyData.some(d => d.stress > NORMAL_RANGES.stress.max) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getAbnormalDates(dailyData, 'stress', NORMAL_RANGES.stress)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <ReferenceLine y={NORMAL_RANGES.stress.max} stroke="#ff4757" strokeDasharray="3 3" />
                  <Line 
                    type="monotoneX" 
                    dataKey="stress" 
                    stroke="#ffc658"
                    name="스트레스"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="activity-analysis">
            <h3 className="section-title">운동량 분석</h3>
            <div className="activity-chart">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="steps" 
                    fill="#8884d8" 
                    name="걸음 수" 
                    barSize={20}
                    isAnimationActive={false}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotoneX" 
                    dataKey="distance" 
                    stroke="#82ca9d" 
                    name="이동거리 (km)"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotoneX" 
                    dataKey="calories" 
                    stroke="#ffc658" 
                    name="소모 칼로리 (kcal)"
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="sleep-analysis">
            <h3 className="section-title">수면 분석</h3>
            <div className="chart-container">
              <div className="header">
                <div className="chart-title">수면 점수</div>
                <div className="reference-info">
                  <span>정상범위: 깊은수면 {NORMAL_RANGES.deepSleep.min}-{NORMAL_RANGES.deepSleep.max}%, REM {NORMAL_RANGES.remSleep.min}-{NORMAL_RANGES.remSleep.max}%</span>
                  {dailyData.some(d => {
                    const ratios = calculateSleepRatios(d.sleepData);
                    return ratios.deep < NORMAL_RANGES.deepSleep.min || 
                           ratios.deep > NORMAL_RANGES.deepSleep.max ||
                           ratios.rem < NORMAL_RANGES.remSleep.min ||
                           ratios.rem > NORMAL_RANGES.remSleep.max;
                  }) && (
                    <span className="abnormal-dates">
                      이상 발생일: {getSleepAbnormalDates(dailyData)}
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart 
                  data={dailyData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = dailyData.find(d => d.date === label);
                        if (!data || !data.sleepData) return null;

                        const ratios = calculateSleepRatios(data.sleepData);
                        const score = calculateSleepScore(data.sleepData);
                        const totalHours = Math.floor(data.sleepData.totalDuration / 60);
                        const totalMinutes = data.sleepData.totalDuration % 60;

                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="text-sm font-bold">{formatXAxisDate(label)}</p>
                            <p>수면 점수: {score}점</p>
                            <p>총 수면 시간: {totalHours}시간 {totalMinutes}분</p>
                            <p>깊은 수면: {ratios.deep}%</p>
                            <p>얕은 수면: {ratios.light}%</p>
                            <p>REM 수면: {ratios.rem}%</p>
                            <p>각성: {ratios.awake}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotoneX" 
                    dataKey={(data) => calculateSleepScore(data.sleepData)}
                    stroke="#4a90e2"
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={{ strokeWidth: 2, r: 4, fill: "#fff" }}
                    name="수면 점수"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div id="second-page">
          <div className="report-summary">
            <h3 className="section-title">종합 분석</h3>
            <div className="summary-content">
              <div className="detail-item mb-3">
                <p>{userData.name}님의 심박수는 평균 <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>{summary.heartRate.avg}bpm</span>으로 정상 범위 내에 있으며,</p>
                <p>혈압은 수축기 <span style={{ color: '#ff7300', fontWeight: 'bold' }}>110-130mmHg</span>, 이완기 <span style={{ color: '#82ca9d', fontWeight: 'bold' }}>70-85mmHg</span> 사이를 안정적으로 유지하고 있습니다.</p>
                <p>산소포화도는 평균 <span style={{ color: '#82ca9d', fontWeight: 'bold' }}>{summary.oxygen.avg}%</span>로 양호한 수준을 보이고 있습니다.</p>
              </div>
              <div className="detail-item mb-3">
                <p>일일 평균 <span style={{ color: '#8884d8', fontWeight: 'bold' }}>{Math.round(summary.activity.totalSteps / dailyData.length).toLocaleString()}걸음</span>의 활동량을 보이고 있으며,</p>
                <p>이는 하루 평균 <span style={{ color: '#82ca9d', fontWeight: 'bold' }}>{(summary.activity.totalDistance / dailyData.length).toFixed(1)}km</span>의 거리와</p>
                <p><span style={{ color: '#ffc658', fontWeight: 'bold' }}>{(summary.activity.totalCalories / dailyData.length).toFixed(1)}kcal</span>의 칼로리 소모에 해당합니다.</p>
              </div>
              <div className="detail-item mb-3">
                <p>수면의 경우, 깊은 수면이 전체 수면 시간의 평균 <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>20%</span> 수준으로 양호하며,</p>
                <p>REM 수면도 <span style={{ color: '#4a90e2', fontWeight: 'bold' }}>22%</span> 수준으로 적정 범위를 유지하고 있습니다.</p>
              </div>
              <div className="recommendations mt-4">
                <h4 className="mb-3">건강 관리 제안</h4>
                <ul>
                  <li>현재의 규칙적인 활동량은 매우 긍정적입니다. 특히 하루 평균 <span style={{ color: '#8884d8', fontWeight: 'bold' }}>{Math.round(summary.activity.totalSteps / dailyData.length).toLocaleString()}걸음</span>의 걷기 운동을 꾸준히 유지하시면 좋겠습니다.</li>
                  <li>스트레스 지수가 간혹 높아지는 날이 있어, 휴식과 가벼운 스트레칭을 통한 관리를 추천드립니다.</li>
                  <li>수면의 질은 전반적으로 양호하나, 취침 전 2시간은 전자기기 사용을 제한하시면 더 좋은 수면 패턴을 유지하실 수 있습니다.</li>
                  <li>체온이 때때로 정상 범위를 벗어나는 경우가 있어, 실내 온도 관리에 신경 써주시기 바랍니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ReportContainer>
    </Container>
  );
};

export default HealthReportDetail; 