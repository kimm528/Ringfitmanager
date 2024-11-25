import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import BarCellRenderer from './BarCellRenderer';

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
      const formattedData = users.map((user) => ({
        name: user.name,
        ring: user.ring?.ConnectedTime ? 'Connected' : 'Disconnected',
        heartRate: user.data.bpm || 0,
        oxygenSaturation: user.data.oxygen || 0,
        stressLevel: user.data.stress || 0,
        riskLevel: user.data.bpm > 100 ? 'High' : user.data.bpm < 60 ? 'Low' : 'Moderate',
      }));
      setRowData(formattedData);
    }
  }, []);

  const columnDefs = [
    { field: 'name', headerName: '이름', sortable: true, filter: true },
    {
      field: 'ring',
      headerName: '링 상태',
      cellStyle: (params) =>
        params.value === 'Connected'
          ? { backgroundColor: 'lightgreen', color: 'black', fontWeight: 'bold' }
          : { backgroundColor: 'pink', color: 'black', fontWeight: 'bold' },
    },
    {
      field: 'heartRate',
      headerName: '심박수',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={150}
          thresholds={{ low: 60, high: 100 }}
        />
      ),
    },
    {
      field: 'oxygenSaturation',
      headerName: '산소포화도',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={100}
          thresholds={{ low: 95, high: 98 }}
        />
      ),
    },
    {
      field: 'stressLevel',
      headerName: '스트레스',
      cellRenderer: (params) => (
        <BarCellRenderer
          value={params.value}
          max={10}
          thresholds={{ low: 4, high: 7 }}
        />
      ),
    },
    {
      field: 'riskLevel',
      headerName: '위험도',
      sortable: true,
      cellStyle: (params) => {
        const colorMap = {
          Low: 'lightgreen',
          Moderate: 'orange',
          High: 'red',
        };
        return {
          backgroundColor: colorMap[params.value] || 'lightgray',
          color: 'black',
          fontWeight: 'bold',
        };
      },
    },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        animateRows={true}
        pagination={true}
        paginationPageSize={10}
      />
    </div>
  );
};

export default DataGridView;
