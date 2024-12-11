// src/components/DataGridView.js

import React, { useEffect, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import BarCellRenderer from './BarCellRenderer';
import { PiSirenFill, PiPlugsConnectedBold } from 'react-icons/pi';
import { TbPlugConnected } from "react-icons/tb";

const DataGridView = ({ users }) => {
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);

  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  useEffect(() => {
    if (users && users.length > 0 && gridApi) {
      const formattedData = users.map((user) => ({
        id: user.id,
        name: user.name,
        ring: user.ring?.ConnectedTime ? 'Connected' : 'Disconnected',
        ringName: user.ring?.Name || 'Unknown Ring',
        heartRate: user.data.bpm !== undefined ? user.data.bpm : 0,
        oxygenSaturation: user.data.oxygen !== undefined ? user.data.oxygen : 0,
        stressLevel: user.data.stress !== undefined ? user.data.stress : 0,
        temperature: user.data.temperature !== undefined ? user.data.temperature : 0,
        bloodPressure: user.data.bloodPressure || { systolic: 0, diastolic: 0 },
        riskLevel: calculateRiskLevel(user),
        thresholds: user.thresholds,
      }));

      // 기존 데이터가 없을 때만 전체 데이터 설정
      if (rowData.length === 0) {
        setRowData(formattedData);
      } else {
        // 기존 데이터가 있으면 개별 행 업데이트
        formattedData.forEach(newRow => {
          const node = gridApi.getRowNode(newRow.id);
          if (node) {
            node.setData(newRow);
          }
        });
      }
    }
  }, [users, gridApi]);

  // 위험도 계산 함수
  const calculateRiskLevel = (user) => {
    let riskLevel = 'Moderate';
    const { data: { bpm, oxygen, temperature }, data: { bloodPressure = {} }, thresholds = {} } = user;
    
    // 심박수 위험도 계산
    if (bpm > 0) {
      if ((bpm >= thresholds.heartRateWarningHigh) || (bpm <= thresholds.heartRateWarningLow)) {
        riskLevel = 'Low';
      }
      if ((bpm >= thresholds.heartRateDangerHigh) || (bpm <= thresholds.heartRateDangerLow)) {
        riskLevel = 'High';
      }
    }

    // 체온 위험도 계산
    if (temperature > 0) {
      if (temperature < 35 || temperature > 38) {
        riskLevel = 'High';
      }
    }

    // 혈압 위험도 계산
    if (bloodPressure.systolic > 0 && bloodPressure.diastolic > 0) {
      if (bloodPressure.systolic > 140 || bloodPressure.systolic < 90) {
        riskLevel = 'High';
      }
      if (bloodPressure.diastolic > 90 || bloodPressure.diastolic < 60) {
        riskLevel = 'High';
      }
    }

    // 산소포화도 위험도 계산
    if (oxygen > 0 && oxygen < 90) {
      riskLevel = 'High';
    }

    return riskLevel;
  };

  const defaultColDef = {
    sortable: true,
    resizable: true,
    suppressSizeToFit: false,
    cellStyle: { fontSize: '16px', display: 'flex', alignItems: 'center' },
  };

  const columnDefs = [
    { 
      field: 'name', 
      headerName: '이름', 
      sortable: true, 
      cellRenderer: (params) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{ 
              fontSize: '16px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              maxWidth: '150px' // 최대 너비 설정
            }}
            title={params.value} // 툴팁을 위해 title 속성 추가
          >
            {params.value}
          </span>
        </div>
      ),
      width: 100,
    },
    // 체온 컬럼 추가
    {
      field: 'temperature',
      headerName: '체온 °C',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={42} // 체온의 최대값 설정 (예: 42°C)
          thresholds={{ low: 35, high: 38 }} // 예시 임계값
          showValue
          type="temperature"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    {
      field: 'bloodPressure.systolic',
      headerName: '혈압(수축기) mmHg',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={180} 
          thresholds={{ low: 90, high: 140 }} // 임계값
          showValue
          type="bloodPressureSystolic"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    // 혈압 이완기 컬럼
    {
      field: 'bloodPressure.diastolic',
      headerName: '혈압(이완기) mmHg',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100} 
          thresholds={{ low: 60, high: 90 }} // 임계값
          showValue
          type="bloodPressureDiastolic"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    {
      field: 'heartRate',
      headerName: '심박수 bpm',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={150}
          thresholds={{
            danger: {
              low: params.data.thresholds?.heartRateDangerLow || 50,
              high: params.data.thresholds?.heartRateDangerHigh || 110
            }
          }}
          showValue
          isHeartRate={true}
          type="heartRate"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    {
      field: 'oxygenSaturation',
      headerName: '산소포화도 %', 
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{ low: 90, high: 100 }}
          showValue
          type="oxygenSaturation"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    { 
      field: 'stressLevel',
      headerName: '스트레스',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{ low: 0, high: 66 }} // 임계값 수정: 66 이상만 위험
          showValue
          type="stressLevel"
        />
      ),
      cellStyle: { fontSize: '16px' },
      width: 200,
    },
    {
      field: 'riskLevel',
      headerName: '위험도',
      cellRenderer: (params) => {
        const isHighRisk = 
          params.value === 'High' || 
          (params.data.oxygenSaturation < 90 && params.data.oxygenSaturation > 0) ||
          (params.data.temperature > 0 && (params.data.temperature < 35 || params.data.temperature > 38)) ||
          (params.data.bloodPressure.systolic > 0 && (params.data.bloodPressure.systolic > 140 || params.data.bloodPressure.systolic < 90)) ||
          (params.data.bloodPressure.diastolic > 0 && (params.data.bloodPressure.diastolic > 90 || params.data.bloodPressure.diastolic < 60));

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
      width: 100,
      resizable: false
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
            <span 
              style={{ 
                fontSize: '16px', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                maxWidth: '150px' // 최대 너비 설정
              }}
              title={ringName} // 툴팁을 위해 title 속성 추가
            >
              {ringName}
            </span>
          </div>
        );
      },
      cellStyle: { fontSize: '16px' },
      width: 200,
      resizable: false
    },
  ];

  return (
    <div
      className="ag-theme-alpine"
      style={{
        height: '100vh',
        width: '100%',
        overflow: 'auto',
        paddingTop: '10px',
      }}
    >
      <style>
        {`
          .ag-header {
            position: sticky;
            top: 0;
            z-index: 2;
            background-color: white;
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          /* Tooltip 스타일 */
          .ag-theme-alpine .ag-cell[title]:hover:after {
            content: attr(title);
            position: absolute;
            background: #333;
            color: #fff;
            padding: 5px;
            border-radius: 3px;
            top: 100%;
            left: 0;
            white-space: nowrap;
            z-index: 10;
          }
        `}
      </style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        pagination={true}
        paginationPageSize={100}
        domLayout="normal"
        getRowNodeId={(data) => data.id}
        deltaRowDataMode={true}
        onGridReady={onGridReady}
        suppressScrollOnNewData={true}
        maintainColumnOrder={true}
      />
    </div>
  );
};

export default DataGridView;
