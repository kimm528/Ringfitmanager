import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css'; // AG Grid 기본 스타일
import 'ag-grid-community/styles/ag-theme-alpine.css'; // AG Grid 테마 스타일

const DataGridView = () => {
  const [rowData, setRowData] = useState([
    { symbol: 'AAPL', price: 150, change: 1.2, volume: 200000 },
    { symbol: 'GOOGL', price: 2800, change: -2.1, volume: 100000 },
    { symbol: 'AMZN', price: 3400, change: 0.8, volume: 50000 },
  ]);

  const [columnDefs] = useState([
    { field: 'symbol', headerName: 'Symbol', sortable: true, filter: true },
    {
      field: 'price',
      headerName: 'Price',
      sortable: true,
      cellStyle: (params) =>
        params.value > 2000
          ? { backgroundColor: 'lightgreen', color: 'black' }
          : { backgroundColor: 'pink', color: 'black' },
    },
    {
      field: 'change',
      headerName: 'Change',
      sortable: true,
      cellStyle: (params) =>
        params.value >= 0
          ? { color: 'green', fontWeight: 'bold' }
          : { color: 'red', fontWeight: 'bold' },
    },
    { field: 'volume', headerName: 'Volume', sortable: true },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRowData((prevData) =>
        prevData.map((row) => ({
          ...row,
          price: parseFloat((row.price + Math.random() * 10 - 5).toFixed(2)), // 가격 변동
          change: parseFloat((Math.random() * 2 - 1).toFixed(2)), // 변화량
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
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
