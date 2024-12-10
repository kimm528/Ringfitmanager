// src/components/Dashboard.js

import React, { useState, useMemo, useCallback } from 'react';
import Card from './Card';
import Modal from './Modal';
import { calculateUserStatus } from './CalculateUserStatus';
import { motion } from 'framer-motion';
import { Grid, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css'; // react-virtualized 기본 스타일 임포트

const Dashboard = ({
  showModal,
  setShowModal,
  users,
  searchQuery,
  handleAddUser,
  updateUser,
  deleteUser,
  availableRings,
  toggleFavorite,
  disconnectInterval,
  getNewId,
  sortOption
}) => {
  const [newUser, setNewUser] = useState({
    name: '',
    gender: '',
    age: '',
  });

  const parseCreateDateTime = (createDateTime) => {
    if (!createDateTime || createDateTime.length !== 12) return new Date(0); // 기본 날짜
    const year = parseInt(createDateTime.slice(0, 2), 10) + 2000; // '24' -> 2024
    const month = parseInt(createDateTime.slice(2, 4), 10) - 1; // 월은 0부터 시작
    const day = parseInt(createDateTime.slice(4, 6), 10);
    const hours = parseInt(createDateTime.slice(6, 8), 10);
    const minutes = parseInt(createDateTime.slice(8, 10), 10);
    const seconds = parseInt(createDateTime.slice(10, 12), 10);
    
    return new Date(year, month, day, hours, minutes, seconds);
  };
  
  const sortByOption = useCallback((a, b) => {
    switch (sortOption) {
      case '심박수 순': {
        const diff = (b.data?.bpm || 0) - (a.data?.bpm || 0);
        if (diff !== 0) {
          return diff; // 심박수가 다르면 심박수 기준 정렬
        } else {
          // 심박수가 같다면 이름순으로 정렬
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '즐겨찾기 순': {
        const diff = (b.isFavorite === true ? 1 : 0) - (a.isFavorite === true ? 1 : 0);
        if (diff !== 0) {
          return diff; // 즐겨찾기 여부가 다르면 그 기준으로 정렬
        } else {
          // 즐겨찾기 상태가 같다면 이름순으로 정렬
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '최근 등록순': {
        const aDate = parseCreateDateTime(a.CreateDateTime);
        const bDate = parseCreateDateTime(b.CreateDateTime);
        const diff = bDate - aDate;
        if (diff !== 0) {
          return diff; // 등록순이 다르면 등록 시간 기준
        } else {
          // 등록시간이 같다면 이름순 정렬
          return (a.name || '').localeCompare(b.name || '', 'ko');
        }
      }
      case '이름 순':
      default:
        return (a.name || '').localeCompare(b.name || '', 'ko');
    }
  }, [sortOption, parseCreateDateTime]);

  // Filter and Sort Users using useMemo for performance
  const sortedUsers = useMemo(() => {
    // 검색어로 필터링
    const filtered = users.filter((user) =>
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    // 각 사용자에 대해 위험 상태 계산
    const usersWithStatus = filtered.map((user) => ({
      ...user,
      status: calculateUserStatus(user),
    }));
  
    // 사용자 정렬
    usersWithStatus.sort((a, b) => {
      // 'danger' 상태인 사용자만 상단으로 정렬
      if (a.status === 'danger' && b.status !== 'danger') {
        return -1;
      } else if (b.status === 'danger' && a.status !== 'danger') {
        return 1;
      } else {
        return sortByOption(a, b); // 선택한 정렬 옵션 적용
      }
    });
  
    return usersWithStatus;
  }, [users, searchQuery, sortOption, sortByOption, calculateUserStatus]);

  const formatDateTime = (date) => {
    const padZero = (num) => num.toString().padStart(2, '0');
    return (
      date.getFullYear().toString().slice(-2) +
      padZero(date.getMonth() + 1) +
      padZero(date.getDate()) +
      padZero(date.getHours()) +
      padZero(date.getMinutes()) +
      padZero(date.getSeconds())
    );
  };

  // Handle User Addition
  const handleSubmit = useCallback(async () => {
    if (!newUser.name || !newUser.gender || !newUser.age) {
      alert('모든 필드를 입력하세요.');
      return;
    }
  
    try {
      const gender = Number(newUser.gender);
      const createDateTime = formatDateTime(new Date()); // 현재 시간으로 설정
  
      let newId = getNewId(users);
      const userToAdd = {
        ...newUser,
        id: newId,
        gender: gender,
        CreateDateTime: createDateTime, // CreateDateTime 추가
      };
  
      await handleAddUser(userToAdd); // 사용자 추가 완료를 기다림
      setNewUser({ name: '', gender: '', age: '' });
      setShowModal(false);
    } catch (error) {
      console.error('사용자 추가 실패:', error);
      alert('사용자 추가 중 오류가 발생했습니다.');
    }
  }, [newUser, handleAddUser, setShowModal, formatDateTime, users, getNewId]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 상단 레이아웃: 센터 현황 버튼과 정렬 버튼 */}
      <div className="flex justify-between items-center pt-20">
        {/* 상단 요소가 필요하면 추가 */}
      </div> 

      {/* 카드 리스트 - Wrap Panel with Virtualization */}
      <div
        className="dashboard-container flex-grow overflow-auto p-4" // 패딩 추가
      >
        <AutoSizer>
          {({ height, width }) => {
            const margin = 10; // 각 셀의 마진 (px 단위)
            const minColumnWidth = 400; // 최소 카드 너비

            // 컬럼 수 계산 (화면 너비와 최소 컬럼 너비를 고려)
            const columnCount = Math.max(
              1,
              Math.floor((width + margin) / (minColumnWidth + margin))
            );

            // 컬럼 너비 계산 (전체 너비에서 총 마진을 빼고 컬럼 수로 나눔)
            const columnWidth = Math.floor(
              (width - margin * (columnCount + 1)) / columnCount
            );

            const rowHeight = 500 + margin; // Card 높이 + 상단 마진
            const rowCount = Math.ceil(sortedUsers.length / columnCount); // 총 행 수

            // react-virtualized의 Cell 렌더러 함수
            const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
              const index = rowIndex * columnCount + columnIndex;
              if (index >= sortedUsers.length) {
                return null; // 빈 셀 처리
              }
              const user = sortedUsers[index];
              return (
                <div
                  key={key}
                  style={{
                    ...style,
                    left: style.left + margin, // 왼쪽 마진 추가
                    top: style.top + margin,   // 상단 마진 추가
                    width: columnWidth,        // 컬럼 너비 설정
                    height: rowHeight - margin, // 행 높이 설정 (마진 제외)
                  }}
                >
                  <motion.div layout>
                    <Card
                      user={user}
                      toggleFavorite={toggleFavorite}
                      updateUser={updateUser}
                      deleteUser={deleteUser}
                      availableRings={availableRings}
                      users={users}
                      disconnectInterval={disconnectInterval}
                    />
                  </motion.div>
                </div>
              );
            };

            return (
              <Grid
                cellRenderer={cellRenderer}
                columnCount={columnCount}
                columnWidth={columnWidth}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
                overscanRowCount={5} // 성능 최적화를 위해 증가
              />
            );
          }}
        </AutoSizer>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="bg-white p-8 rounded-lg shadow-lg w-[500px]">
            <h2 className="text-xl font-bold mb-4">새 사용자 추가</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block">이름</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded w-full"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block">성별</label>
                <select
                  name="gender"
                  value={newUser.gender !== '' ? newUser.gender : ''}
                  onChange={(e) =>
                    setNewUser({ ...newUser, gender: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded w-full"
                >
                  <option value="">성별을 선택하세요</option>
                  <option value="0">남성</option>
                  <option value="1">여성</option>
                </select>
              </div>
              <div>
                <label className="block">나이</label>
                <input
                  type="number"
                  name="age"
                  value={newUser.age}
                  onChange={(e) =>
                    setNewUser({ ...newUser, age: e.target.value })
                  }
                  className="p-2 border border-gray-300 rounded w-full"
                  placeholder="나이를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white py-2 px-4 rounded"
              >
                사용자 추가
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-black py-2 px-4 rounded"
              >
                닫기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
