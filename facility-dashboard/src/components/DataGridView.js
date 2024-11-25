import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import BarCellRenderer from './BarCellRenderer';
import { PiSirenFill, PiPlugsConnectedBold } from 'react-icons/pi'; // 아이콘 임포트
import { TbPlugConnected } from "react-icons/tb";
import Header from './Header';

const DataGridView = () => {
  const [rowData, setRowData] = useState([]);

  // 세션 스토리지에서 데이터 로드
  const loadFromSessionStorage = (key, defaultValue) => {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  useEffect(() => {
    // 세션에서 users 데이터를 로드
    const users = loadFromSessionStorage('users', []);

    // rowData 형식으로 변환
    if (users && users.length > 0) {
      const formattedData = users.map((user) => {
        const bpm = user.data.bpm || 0;
        const thresholds = user.thresholds || {};

        let riskLevel = 'Moderate';
        if (bpm > 0) {
          if ((bpm >= thresholds.heartRateWarningHigh) || (bpm <= thresholds.heartRateWarningLow)) {
            riskLevel = 'Low';
          }
          if ((bpm >= thresholds.heartRateDangerHigh) || (bpm <= thresholds.heartRateDangerLow)) {
            riskLevel = 'High';
          }
        }

        return {
          name: user.name,
          ring: user.ring?.ConnectedTime ? 'Connected' : 'Disconnected',
          heartRate: bpm,
          oxygenSaturation: user.data.oxygen || 0,
          stressLevel: user.data.stress || 0,
          riskLevel,
        };
      });
      setRowData(formattedData);
    }
  }, []);

  const columnDefs = [
    { field: 'name', headerName: '이름', sortable: true, filter: true, cellStyle: { fontSize: '16px' }// 헤더 폰트 크기 설정
 },
    {
      field: 'heartRate',
      headerName: '심박수',
      cellRenderer: (params) => {
        const thresholds = params.data.thresholds || {
          heartRateWarningLow: 60,
          heartRateWarningHigh: 100,
        };
        return (
          <BarCellRenderer
            value={params.value}
            max={150}
            thresholds={{
              low: 90, // 90 미만 위험
              high: 95, // 95 이상 정상
            }}
            showValue
            riskLevel={params.data.riskLevel}
            type="heartRate"
          />
        );
      },
      cellStyle: { fontSize: '16px'},
    },
    {
      field: 'oxygenSaturation',
      headerName: '산소포화도',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{
            low: 90, // 90 미만 위험
            high: 95, // 95 이상 정상
          }}
          showValue
          type={'oxygenSaturation'}
        />
      ),
      cellStyle: { fontSize: '16px' },
    },
    {
      field: 'stressLevel',
      headerName: '스트레스',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{
            low: 33, // 33 이하 정상
            high: 66, // 66 이상 위험
          }}
          showValue
          type={'stressLevel'}
        />
      ),
      cellStyle: { fontSize: '16px' },
    },
    {
      field: 'riskLevel',
      headerName: '위험도',
      sortable: true,
      cellRenderer: (params) => {
        const isHighRisk = params.value === 'High' || (params.data.oxygenSaturation == 0 ? false : (params.data.oxygenSaturation < 90)); // 위험한 경우
        const isNormal = isHighRisk ? false : true; // 정상인 경우
        const style = {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        };

        return (
          <div style={style}>
            {isHighRisk && (
              <PiSirenFill style={{ color: 'red', fontSize: '24px', animation: 'blink 1s linear infinite' }} />
            )}
          </div>
        );
      },
      cellStyle: { fontSize: '16px' },
      width: 100,  // 이 부분에서 `width`를 설정합니다.
      resizable: false // 크기 조정 비활성화
    },
    {
      field: 'ring',
      headerName: '링 상태',
      cellRenderer: (params) => {
        const isConnected = params.value === 'Connected';
        const iconStyle = { fontSize: '24px', justifyContent: 'left', alignItems: 'center' };

        return (
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '5px' }}>
{isConnected ? (
              <PiPlugsConnectedBold style={{ color: 'green', ...iconStyle }} />
            ) : (
              <TbPlugConnected style={{ color: 'gray', ...iconStyle }} />
            )}
          </div>
        );
      },
      cellStyle: { fontSize: '16px' },
      width: 105,  // 이 부분에서 `width`를 설정합니다.
      resizable: false // 크기 조정 비활성화
    },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 100px)', width: '100%', paddingTop: '80px'}}>
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        animateRows={true}
        pagination={true}
        paginationPageSize={100}
        domLayout="autoHeight" // 자동으로 높이 맞추기
      />
    </div>
  );
};

export default DataGridView;
