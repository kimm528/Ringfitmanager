import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import { ko } from 'date-fns/locale';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

// 스타일 컴포넌트들을 특정 클래스 내부로 범위 제한
const HealthReportContainer = styled.div.attrs({
  className: 'health-report-container'
})`
  &.health-report-container {
    height: calc(100vh - 180px);
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;

    .health-report-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .card {
        border: none;
        border-radius: 15px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
        background: white;
      }

      .card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
      }

      .card-title {
        color: #2c3e50;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }

      .form-control {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        transition: all 0.2s;
        background-color: #f8f9fa;

        &:focus {
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
          background-color: white;
        }
      }

      .date-picker-label {
        color: #6c757d;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .ag-theme-alpine {
        flex: 1;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

        .ag-root-wrapper {
          border: none;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .ag-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .ag-header-cell {
          font-size: 0.9rem;
          font-weight: 600;
          color: #495057;
        }
        
        .ag-row {
          cursor: default;
          border-bottom: 1px solid #f1f3f5;
          
          &:hover {
            background-color: #f8f9fa;
          }
        }

        .ag-row-even {
          background-color: #ffffff;
        }

        .ag-row-odd {
          background-color: #fcfcfc;
        }

        .ag-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          color: #495057;
          padding: 0.75rem 1rem;
        }

        .ag-cell-value {
          color: inherit;
          text-decoration: none;

          &:hover {
            text-decoration: none;
            color: inherit;
          }
        }

        button.btn-primary {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: white;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 120px;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(74, 144, 226, 0.25);

          &:hover {
            background: linear-gradient(135deg, #357abd 0%, #2868a9 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(74, 144, 226, 0.25);
          }

          svg {
            width: 16px;
            height: 16px;
            transition: transform 0.3s ease;
          }

          &:hover svg {
            transform: translateX(2px);
          }
        }

        .ag-header-cell-label {
          justify-content: center;
        }
      }
    }
  }
`;

const ReportCard = styled(Card)`
  &.report-stat-card {
    margin-bottom: 1rem;
    .card-title {
      font-size: 0.9rem;
      color: #666;
    }
    .stat-value {
      font-size: 1.2rem;
      font-weight: bold;
      color: #333;
    }
  }
`;

const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
//const url = 'https://api.ring.dotories.com';
const url = 'https://dotoriesringcloudserver-b2bgarb8bth5b9ff.koreacentral-01.azurewebsites.net';


const formatDateYYMMDD = (date) => {
  const year = String(date.getFullYear()).slice(-2);
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}${month}${day}`;
};

const HealthReport = ({ users }) => {
  const [rowData, setRowData] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const navigate = useNavigate();

  const columnDefs = [
    { 
      field: 'name', 
      headerName: '이름',
      autoSize: true,
      minWidth: 100,
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-header'
    },
    { 
      field: 'gender', 
      headerName: '성별',
      autoSize: true,
      minWidth: 80,
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-header'
    },
    { 
      field: 'position', 
      headerName: '나이',
      autoSize: true,
      minWidth: 80,
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-header'
    },
    {
      field: 'currentStatus',
      headerName: '현재 상태',
      autoSize: true,
      minWidth: 120,
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-header',
      valueGetter: params => {
        const data = params.data.data;
        if (!data) return 0;
        
        const heartRate = data.bpm || 0;
        if (heartRate === 0) return 0;
        if (heartRate > 100) return 3;
        if (heartRate < 60) return 1;
        return 2;
      },
      cellRenderer: params => {
        const value = params.getValue();
        switch(value) {
          case 3: return '⚠️ 심박수 높음';
          case 1: return '⚠️ 심박수 낮음';
          case 2: return '정상';
          default: return '-';
        }
      },
      comparator: (valueA, valueB) => valueA - valueB
    },
    {
      headerName: '리포트',
      autoSize: true,
      minWidth: 100,
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-header',
      cellRenderer: params => (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => {
              const searchParams = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
              });
              navigate('/health-report/detail/' + params.data.id + '?' + searchParams.toString());
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3.75h3.75M9 15h3.75M9 12h3.75m3-3h3.75m-3 3h3.75m-3 3h3.75M6.75 3h.008v.008h-.008V3Z" />
            </svg>
            리포트 보기
          </Button>
        </div>
      )
    }
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressSizeToFit: false
  };

  useEffect(() => {
    if (users) {
      const formattedUsers = users.map(user => ({
        name: user.name,
        id: user.id,
        gender: user.gender === 0 ? '남성' : '여성',
        position: user.age ? `${user.age}세` : '-',
        data: user.data || {}
      }));
      setRowData(formattedUsers);
    }
  }, [users]);

  const fetchHealthDataForDateRange = async (userId, startDate, endDate) => {
    const siteId = Cookies.get('siteId');
    if (!siteId) {
      console.error('사이트 ID를 찾을 수 없습니다.');
      return null;
    }

    const healthData = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      try {
        const formattedDate = formatDateYYMMDD(currentDate);
        const response = await axios.get(
          `${url}/api/user/health?siteId=${siteId}&yearMonthDay=${formattedDate}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credentials}`,
            },
          }
        );

        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const userHealthData = data.Data?.find(item => item.UserId === userId);
        
        if (userHealthData) {
          healthData.push({
            date: formattedDate,
            heartRate: userHealthData.HeartRateArr,
            oxygen: userHealthData.BloodOxygenArr,
            stress: userHealthData.PressureArr,
            temperature: userHealthData.TemperatureArr
          });
        }

      } catch (error) {
        console.error('건강 데이터 조회 중 오류:', error);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return healthData;
  };

  const generateReport = async (userData) => {
    const healthData = await fetchHealthDataForDateRange(userData.id, startDate, endDate);
    
    if (!healthData || healthData.length === 0) {
      alert('선택한 기간의 건강 데이터가 없습니다.');
      return;
    }

    // 데이터 가공
    const processedData = healthData.flatMap(dayData => {
      return dayData.heartRate.map((_, index) => ({
        time: `${dayData.date} ${index}:00`,
        heartRate: dayData.heartRate[index] || 0,
        oxygen: dayData.oxygen[index] || 0,
        temperature: dayData.temperature[index] || 0,
        stress: dayData.stress[index] || 0
      }));
    });

    // 통계 계산
    const stats = {
      heartRate: {
        avg: Math.round(processedData.reduce((acc, curr) => acc + curr.heartRate, 0) / processedData.length),
        max: Math.max(...processedData.map(d => d.heartRate)),
        min: Math.min(...processedData.map(d => d.heartRate))
      },
      oxygen: {
        avg: Math.round(processedData.reduce((acc, curr) => acc + curr.oxygen, 0) / processedData.length),
        max: Math.max(...processedData.map(d => d.oxygen)),
        min: Math.min(...processedData.map(d => d.oxygen))
      },
      temperature: {
        avg: (processedData.reduce((acc, curr) => acc + curr.temperature, 0) / processedData.length).toFixed(1),
        max: Math.max(...processedData.map(d => d.temperature)).toFixed(1),
        min: Math.min(...processedData.map(d => d.temperature)).toFixed(1)
      },
      stress: {
        avg: Math.round(processedData.reduce((acc, curr) => acc + curr.stress, 0) / processedData.length),
        max: Math.max(...processedData.map(d => d.stress)),
        min: Math.min(...processedData.map(d => d.stress))
      }
    };

    setReportData({ timeData: processedData, stats, userData });
    setShowReport(true);
  };

  const renderStats = () => {
    if (!reportData) return null;
    const { stats } = reportData;

    return (
      <Row className="mb-4">
        <Col md={3}>
          <ReportCard>
            <Card.Body>
              <Card.Title>심박수</Card.Title>
              <div className="stat-value">{stats.heartRate.avg} BPM</div>
              <small>최대: {stats.heartRate.max} / 최소: {stats.heartRate.min}</small>
            </Card.Body>
          </ReportCard>
        </Col>
        <Col md={3}>
          <ReportCard>
            <Card.Body>
              <Card.Title>산소포화도</Card.Title>
              <div className="stat-value">{stats.oxygen.avg}%</div>
              <small>최대: {stats.oxygen.max}% / 최소: {stats.oxygen.min}%</small>
            </Card.Body>
          </ReportCard>
        </Col>
        <Col md={3}>
          <ReportCard>
            <Card.Body>
              <Card.Title>체온</Card.Title>
              <div className="stat-value">{stats.temperature.avg}°C</div>
              <small>최대: {stats.temperature.max}°C / 최소: {stats.temperature.min}°C</small>
            </Card.Body>
          </ReportCard>
        </Col>
        <Col md={3}>
          <ReportCard>
            <Card.Body>
              <Card.Title>스트레스</Card.Title>
              <div className="stat-value">{stats.stress.avg}%</div>
              <small>최대: {stats.stress.max}% / 최소: {stats.stress.min}%</small>
            </Card.Body>
          </ReportCard>
        </Col>
      </Row>
    );
  };

  return (
    <HealthReportContainer>
      <div className="health-report-content">
        <Container fluid className="mt-4 h-100 px-4">
          <Card>
            <Card.Body>
              <Card.Title>건강 리포트</Card.Title>
              <div className="d-flex align-items-center mb-4 bg-light p-3 rounded" style={{ 
                display: 'flex', 
                flexWrap: 'nowrap', 
                overflowX: 'auto', 
                gap: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <span className="date-picker-label me-2">시작일:</span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      if (endDate < date) {
                        setEndDate(date);
                      }
                    }}
                    maxDate={new Date()}
                    minDate={new Date('2024-01-01')}
                    open={startPickerOpen}
                    onSelect={() => setStartPickerOpen(false)}
                    onClickOutside={() => setStartPickerOpen(false)}
                    onInputClick={() => setStartPickerOpen(true)}
                    locale={ko}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    popperContainer={({ children }) => (
                      <div style={{ position: 'absolute', zIndex: 99999 }}>{children}</div>
                    )}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <span className="date-picker-label me-2">종료일:</span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => {
                      setEndDate(date);
                    }}
                    maxDate={new Date()}
                    minDate={startDate}
                    open={endPickerOpen}
                    onSelect={() => setEndPickerOpen(false)}
                    onClickOutside={() => setEndPickerOpen(false)}
                    onInputClick={() => setEndPickerOpen(true)}
                    locale={ko}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    popperContainer={({ children }) => (
                      <div style={{ position: 'absolute', zIndex: 99999 }}>{children}</div>
                    )}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 6);
                      setStartDate(start);
                      setEndDate(end);
                    }}
                    style={{
                      borderRadius: '20px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      minWidth: '70px',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid #dee2e6',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover-shadow"
                  >
                    1주
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 13);
                      setStartDate(start);
                      setEndDate(end);
                    }}
                    style={{
                      borderRadius: '20px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      minWidth: '70px',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid #dee2e6',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover-shadow"
                  >
                    2주
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(end.getMonth() - 1);
                      setStartDate(start);
                      setEndDate(end);
                    }}
                    style={{
                      borderRadius: '20px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      minWidth: '70px',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid #dee2e6',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover-shadow"
                  >
                    1개월
                  </Button>
                </div>
              </div>
              <div className="ag-theme-alpine" style={{ width: '100%', height: '500px' }}>
                <AgGridReact
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onSelectionChanged={params => {
                    const selectedRows = params.api.getSelectedRows();
                    setSelectedUser(selectedRows[0]);
                  }}
                  rowSelection="single"
                  onGridSizeChanged={params => {
                    params.api.sizeColumnsToFit();
                  }}
                  onFirstDataRendered={params => {
                    params.api.sizeColumnsToFit();
                  }}
                  domLayout="autoHeight"
                  rowHeight={48}
                  headerHeight={48}
                />
              </div>
            </Card.Body>
          </Card>
        </Container>

        <Modal size="xl" show={showReport} onHide={() => setShowReport(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {reportData?.userData.name}님의 건강 리포트
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                {startDate.toLocaleDateString()} ~ {endDate.toLocaleDateString()}
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {reportData && (
              <>
                {renderStats()}
                
                <h5 className="mb-3">시간대별 건강 지표</h5>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border rounded shadow">
                            <p className="text-sm font-semibold mb-1">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {
                                  entry.dataKey === 'temperature' ? entry.value.toFixed(1) :
                                  entry.dataKey === 'calories' ? Math.round(entry.value) :
                                  entry.dataKey === 'distance' ? entry.value.toFixed(1) :
                                  entry.value
                                } {
                                  entry.dataKey === 'temperature' ? '°C' :
                                  entry.dataKey === 'calories' ? 'kcal' :
                                  entry.dataKey === 'distance' ? 'km' :
                                  ''
                                }
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#8884d8" name="심박수" />
                    <Line yAxisId="right" type="monotone" dataKey="oxygen" stroke="#82ca9d" name="산소포화도" />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ffc658" name="체온" />
                    <Line yAxisId="right" type="monotone" dataKey="stress" stroke="#ff7300" name="스트레스" />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </HealthReportContainer>
  );
};

export default HealthReport; 