import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import BarCellRenderer from './BarCellRenderer';
import { PiSirenFill, PiPlugsConnectedBold } from 'react-icons/pi';
import { TbPlugConnected } from "react-icons/tb";

const DataGridView = ({ users }) => {
  const [rowData, setRowData] = useState([]);

  useEffect(() => {
    if (users && users.length > 0) {
      // 새로운 formattedData 생성
      const formattedData = users.map((user) => {
        const bpm = user.data.bpm !== undefined ? user.data.bpm : 0;
        const oxygen = user.data.oxygen !== undefined ? user.data.oxygen : 0;
        const stress = user.data.stress !== undefined ? user.data.stress : 0;
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
          id: user.id,
          name: user.name,
          ring: user.ring?.ConnectedTime ? 'Connected' : 'Disconnected',
          ringName: user.ring?.Name || 'Unknown Ring',
          heartRate: bpm,
          oxygenSaturation: oxygen,
          stressLevel: stress,
          riskLevel,
          thresholds: user.thresholds,
        };
      });

      setRowData((prevRowData) => {
        // 기존 rowData를 Map으로 변환하여 빠른 조회 가능하게 함
        const rowDataMap = new Map(prevRowData.map(row => [row.id, row]));

        // formattedData를 순회하며 업데이트
        formattedData.forEach(newRow => {
          if (rowDataMap.has(newRow.id)) {
            const existingRow = rowDataMap.get(newRow.id);

            // 필요한 필드만 업데이트 (여기서는 모든 필드를 업데이트)
            rowDataMap.set(newRow.id, { ...existingRow, ...newRow });
          } else {
            // 새로운 사용자가 추가된 경우
            rowDataMap.set(newRow.id, newRow);
          }
        });

        // Map을 다시 배열로 변환
        return Array.from(rowDataMap.values());
      });

    } else {
      // users가 없으면 빈 배열로 설정
      setRowData([]);
    }
  }, [users]);

  const defaultColDef = {
    sortable: true,
    resizable: true,
  };

  const columnDefs = [
    { field: 'name', headerName: '이름', sortable: true, cellStyle: { fontSize: '16px' } },
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
            thresholds={{ low: thresholds.heartRateWarningLow, high: thresholds.heartRateWarningHigh }}
            showValue
            riskLevel={params.data.riskLevel}
            type="heartRate"
          />
        );
      },
      cellStyle: { fontSize: '16px' },
    },
    {
      field: 'oxygenSaturation',
      headerName: '산소포화도',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{ low: 90, high: 95 }}
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
          thresholds={{ low: 33, high: 66 }}
          showValue
          type={'stressLevel'}
        />
      ),
      cellStyle: { fontSize: '16px' },
    },
    {
      field: 'riskLevel',
      headerName: '위험도',
      cellRenderer: (params) => {
        const isHighRisk = params.value === 'High' || (params.data.oxygenSaturation < 90 && params.data.oxygenSaturation > 0);
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
            <span style={{ fontSize: '16px' }}>{ringName}</span>
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
        paddingTop: '80px',
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
      />
    </div>
  );
};

export default DataGridView;
