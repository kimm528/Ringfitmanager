// src/components/DataGridView.js

import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import BarCellRenderer from './BarCellRenderer';
import { PiSirenFill, PiPlugsConnectedBold } from 'react-icons/pi'; // 아이콘 임포트
import { TbPlugConnected } from "react-icons/tb";
import Header from './Header';

const DataGridView = ({ users }) => { // 'users'를 props로 받음
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
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
          id: user.id, // 고유 ID 추가
          name: user.name,
          ring: user.ring?.ConnectedTime ? 'Connected' : 'Disconnected',
          ringName: user.ring?.Name || 'Unknown Ring', // 링 이름 추가 (필요 시 수정)
          heartRate: bpm,
          oxygenSaturation: user.data.oxygen || 0,
          stressLevel: user.data.stress || 0,
          riskLevel,
          thresholds: user.thresholds, // 정렬 및 렌더링에 필요한 thresholds 추가
        };
      });
      setRowData(formattedData);
      console.log('Formatted Data:', formattedData); // 디버깅용 로그
    } else {
      setRowData([]); // 사용자 데이터가 없으면 빈 배열 설정
    }
  }, [users]); // 'users'가 변경될 때마다 실행

  const defaultColDef = {
    sortable: true,
    resizable: true, // 열 크기 조정 활성화
  };

  const columnDefs = [
    { 
      field: 'name', 
      headerName: '이름', 
      sortable: true,  
      cellStyle: { fontSize: '16px' } // 헤더 폰트 크기 설정
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
      comparator: (a, b, nodeA, nodeB, isDescending) => {
        if (a === b) {
          if(isDescending) {
            return -nodeA.data.name.localeCompare(nodeB.data.name);
          }
          else {
            return nodeA.data.name.localeCompare(nodeB.data.name);
          }
        }
        return a - b;
      },
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
      comparator: (a, b, nodeA, nodeB, isDescending) => {
        if (a === b) {
          if(isDescending) {
            return -nodeA.data.name.localeCompare(nodeB.data.name);
          }
          else {
            return nodeA.data.name.localeCompare(nodeB.data.name);
          }
        }
        return a - b;
      },
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
      comparator: (a, b, nodeA, nodeB, isDescending) => {
        if (a === b) {
          if(isDescending) {
            return -nodeA.data.name.localeCompare(nodeB.data.name);
          }
          else {
            return nodeA.data.name.localeCompare(nodeB.data.name);
          }
        }
        return a - b;
      },
    },
    {
      field: 'riskLevel',
      headerName: '위험도',
      sortable: true,
      comparator: (a, b, nodeA, nodeB, isDescending) => {
        if (a === b) {
          if(isDescending) {
            return -nodeA.data.name.localeCompare(nodeB.data.name);
          }
          else {
            return nodeA.data.name.localeCompare(nodeB.data.name);
          }
        }
        const riskOrder = { High: 1, Moderate: 2, Low: 3 };
        return riskOrder[a] - riskOrder[b];
      },
      cellRenderer: (params) => {
        const isHighRisk = params.value === 'High' || (params.data.oxygenSaturation === 0 ? false : (params.data.oxygenSaturation < 90)); // 위험한 경우
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
        const ringName = params.data.ringName || 'Unknown Ring';
        const iconStyle = { fontSize: '24px', marginRight: '8px' };

        return (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            {isConnected ? (
              <PiPlugsConnectedBold style={{ color: 'green', ...iconStyle }} />
            ) : (
              <TbPlugConnected style={{ color: 'gray', ...iconStyle }} />
            )}
            <span style={{ fontSize: '16px' }}>{ringName}</span>
          </div>
        );
      },
      cellStyle: { fontSize: '16px' },
      width: 200,  // 링 이름을 표시하기 위해 너비 조정
      resizable: false // 크기 조정 비활성화
    },
  ];

  return (
    <div
      className="ag-theme-alpine"
      style={{
        height: '100vh', // 그리드의 전체 높이
        width: '100%',
        overflow: 'auto', // 스크롤 가능
        paddingTop: '80px',
      }}
    >
      <style>
        {`
          .ag-header {
            position: sticky; /* 헤더를 고정 */
            top: 0; /* 화면 상단에 고정 */
            z-index: 2; /* 다른 요소 위로 설정 */
            background-color: white; /* 배경색 */
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef} // 수정: defaultColDef를 변수로 정의
        animateRows={true}
        pagination={true}
        paginationPageSize={100}
        domLayout="normal" // 레이아웃을 고정으로 설정
        getRowNodeId={(data) => data.id} // 고유 ID로 행을 식별
        deltaRowDataMode={true} // 데이터 변경 시 필요한 부분만 업데이트
      />
    </div>
  );
};

export default DataGridView;
