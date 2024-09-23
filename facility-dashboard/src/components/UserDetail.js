import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaEllipsisV, FaHeartbeat, FaPlus, FaBed, FaSmile, FaTint, FaWalking, FaRegCalendarAlt, FaFireAlt, FaRoute } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// 반복적인 카드 UI를 재사용 가능한 컴포넌트로 분리
const InfoCard = ({ icon, title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

const UserDetail = ({ users }) => {
  const { userId } = useParams();

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  };

  const generateDateOptions = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return Array.from({ length: day }, (_, i) => `${year}/${String(month).padStart(2, '0')}/${String(i + 1).padStart(2, '0')}`);
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showBpm, setShowBpm] = useState(true);
  const [showOxygen, setShowOxygen] = useState(true);
  const [showStress, setShowStress] = useState(true);
  const [showSleep, setShowSleep] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  const [sortOption, setSortOption] = useState('all'); // 정렬 옵션
  const [logItems, setLogItems] = useState([
    { id: 1, medicine: '타이레놀 20mg', date: '2024/09/01', dose: '1정', time: '12:30', taken: false },
    { id: 2, medicine: '타이레놀 20mg', date: '2024/09/02', dose: '1정', time: '14:00', taken: true },
    { id: 3, medicine: '타이레놀 20mg', date: '2024/09/03', dose: '1정', time: '13:00', taken: false },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달
  const [newItem, setNewItem] = useState({
    medicine: '',
    date: '',
    dose: '',
    time: '12:00',
    taken: false,
  });

  const [showAllImages, setShowAllImages] = useState(false); // 상태 추가

  const user = users.find(user => user.id === parseInt(userId));
  if (!user || !user.data) return <p>사용자를 찾을 수 없습니다.</p>;

  const { bpm, oxygen, stress, sleep, steps, calories, distance } = user.data;

  const lineData = Array.from({ length: 30 }, (_, index) => ({
    date: String(index + 1),
    bpm: Math.floor(Math.random() * 120) + 60,
    oxygen: Math.floor(Math.random() * 5) + 95,
    stress: Math.floor(Math.random() * 100),
    sleep: Math.floor(Math.random() * 100),
  }));

  const barData = Array.from({ length: 30 }, (_, index) => ({
    date: String(index + 1),
    steps: Math.floor(Math.random() * 10000),
    calories: Math.floor(Math.random() * 2000) + 500,
    distance: Math.floor(Math.random() * 10000),
  }));

  const handleSort = (option) => {
    let sortedItems = [...logItems];
  
    // 먼저 체크 상태를 기준으로 정렬
    sortedItems.sort((a, b) => a.taken - b.taken);
  
    // 선택한 옵션에 따라 추가로 정렬
    if (option === '처방일') {
      sortedItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (option === '복용시간') {
      sortedItems.sort((a, b) => a.time.localeCompare(b.time));
    }
  
    setLogItems(sortedItems);
    setSortOption(option);
  };
  

  // 체크박스 상태 변경
  const handleCheckboxChange = (id) => {
    setLogItems(logItems.map(item => item.id === id ? { ...item, taken: !item.taken } : item));
  };
 // 전체 선택 체크박스 상태 변경
 const handleSelectAllChange = (e) => {
  const isChecked = e.target.checked;
  setLogItems(logItems.map(item => ({ ...item, taken: isChecked })));
};

  // 항목 추가 팝업 열기/닫기
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  // 항목 추가
  const handleAddItem = () => {
    setLogItems([...logItems, { ...newItem, id: logItems.length + 1 }]);
    toggleAddModal();
    setNewItem({
      medicine: '',
      date: '',
      dose: '',
      time: '12:00',
      taken: false,
    });
  };

  const weekExerciseData = [
    { day: '월', score: 79, date: '9/1' },
    { day: '화', score: 65, date: '9/2' },
    { day: '수', score: 100, date: '9/3' },
    { day: '목', score: 72, date: '9/4' },
    { day: '금', score: 78, date: '9/5' },
    { day: '토', score: 100, date: '9/6' },
    { day: '일', score: 100, date: '9/7' },
  ];

  const handleImageUpload = event => {
    const files = Array.from(event.target.files);
    setUploadedImages([...uploadedImages, ...files.map(file => URL.createObjectURL(file))]);
  };

  const dateOptions = generateDateOptions();

  return (
    <div className="p-4">
      {/* 사용자 프로필 정보 */}
      <div className="profile-header flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.age}세 / 신체나이 {user.bodyAge || user.age - 5}세</p>
          </div>
        </div>

        <div className="flex items-center">
          <FaRegCalendarAlt className="text-gray-500 mr-2" />
          <select className="p-2 border border-gray-300 rounded-lg" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
            {dateOptions.map(date => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 건강 정보 카드 */}
      <div className="info-boxes grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard icon={<FaHeartbeat className="text-red-500" />} title="심박수" value={`${bpm} BPM`} />
        <InfoCard icon={<FaTint className="text-blue-500" />} title="혈중 산소" value={`${oxygen}%`} />
        <InfoCard icon={<FaSmile className="text-yellow-500" />} title="스트레스" value={`${stress}점`} />
        <InfoCard icon={<FaBed className="text-gray-500" />} title="수면 점수" value={`${sleep}점`} />
      </div>

      {/* 선그래프 */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-bold mb-4">일별 데이터</h3>
        <div className="legend flex items-center justify-center mb-4">
          {[{ label: "심박수", color: "text-green-500", checked: showBpm, setChecked: setShowBpm },
          { label: "혈중 산소", color: "text-blue-500", checked: showOxygen, setChecked: setShowOxygen },
          { label: "스트레스", color: "text-red-500", checked: showStress, setChecked: setShowStress },
          { label: "수면점수", color: "text-purple-500", checked: showSleep, setChecked: setShowSleep }]
            .map((item, idx) => (
              <label key={idx} className="flex items-center mr-4">
                <input type="checkbox" checked={item.checked} onChange={() => item.setChecked(!item.checked)} />
                <span className={`${item.color} ml-2`}>● {item.label}</span>
              </label>
            ))}
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 200]} />
            <Tooltip />
            {showBpm && <Line type="monotone" dataKey="bpm" stroke="#00c853" strokeWidth={2} dot={{ r: 4 }} unit=" BPM" />}
            {showOxygen && <Line type="monotone" dataKey="oxygen" stroke="#1e88e5" strokeWidth={2} dot={{ r: 4 }} unit="%" />}
            {showStress && <Line type="monotone" dataKey="stress" stroke="#d32f2f" strokeWidth={2} dot={{ r: 4 }} unit=" 점" />}
            {showSleep && <Line type="monotone" dataKey="sleep" stroke="#8e24aa" strokeWidth={2} dot={{ r: 4 }} unit=" 점" />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 걸음수, 칼로리, 이동거리 정보 */}
      <div className="additional-info mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={<FaWalking className="text-green-500" />} title="걸음수" value={`${steps} 걸음`} />
        <InfoCard icon={<FaFireAlt className="text-orange-500" />} title="소모 칼로리" value={`${calories} Kcal`} />
        <InfoCard icon={<FaRoute className="text-blue-500" />} title="이동거리" value={`${distance} Km`} />
      </div>

      {/* 막대 그래프 */}
      <div className="bg-white p-4 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-bold mb-4">활동 데이터 (걸음수, 소모칼로리, 이동거리)</h3>
        <div className="legend flex items-center justify-center mb-4">
          {[{ label: "걸음수", color: "text-blue-500", checked: showSteps, setChecked: setShowSteps },
          { label: "소모 칼로리", color: "text-orange-500", checked: showCalories, setChecked: setShowCalories },
          { label: "이동거리", color: "text-green-500", checked: showDistance, setChecked: setShowDistance }]
            .map((item, idx) => (
              <label key={idx} className="flex items-center mr-4">
                <input type="checkbox" checked={item.checked} onChange={() => item.setChecked(!item.checked)} />
                <span className={`${item.color} ml-2`}>● {item.label}</span>
              </label>
            ))}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            {showSteps && <Bar dataKey="steps" fill="#00bcd4" name="걸음수" />}
            {showCalories && <Bar dataKey="calories" fill="#ff9800" name="소모칼로리 (Kcal)" />}
            {showDistance && <Bar dataKey="distance" fill="#4caf50" name="이동거리 (m)" />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 주간 운동 섹션 */}
      <div className="weekly-exercise bg-white p-4 rounded-lg shadow-md mt-6 relative">
        <h3 className="text-xl font-bold mb-4">주간 운동</h3>
        <FaEllipsisV className="absolute top-4 right-4 text-gray-500 cursor-pointer" />
        <div className="grid grid-cols-7 gap-2 justify-between">
          {weekExerciseData.map((item, index) => (
            <div key={item.date} className="flex flex-col items-center">
            <PieChart width={80} height={80}>
              <Pie
                data={[
                  { name: '점수', value: item.score },
                  { name: '나머지', value: 100 - item.score },
                ]}
                startAngle={90}
                endAngle={-270}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={35}
                stroke="none"
                dataKey="value"
              >
                <Cell key={`cell-${index}`} fill="#0088FE" />
              </Pie> {/* 여기에 닫는 태그 추가 */}
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-blue-500 font-bold">
                {item.score}%
              </text>
            </PieChart>
            <div className="text-center mt-1">
              <div className="font-bold text-gray-800">{item.day}</div>
              <div className="text-sm text-gray-500">{item.date}</div>
            </div>
          </div>
          
          ))}
        </div>
      </div>

{/* Life 로그와 앨범 섹션 */}
<div className="life-album-sections flex gap-4 mt-6">
  {/* Life 로그 섹션 */}
  <div className="life-log bg-white p-4 rounded-lg shadow-md flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Life 로그</h3>
            <div className="flex items-center space-x-2">
              <select
                value={sortOption}
                onChange={(e) => handleSort(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All</option>
                <option value="미복용">미복용 순</option>
                <option value="처방일">처방일 순</option>
                <option value="복용시간">복용시간 순</option>
              </select>
              <FaPlus onClick={toggleAddModal} className="text-blue-500 text-2xl cursor-pointer" />
            </div>
          </div>

          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-gray-100">
              <th className="p-2"><input type="checkbox" onChange={handleSelectAllChange} /></th>
              <th className="p-2">복용약</th>
              <th className="p-2">처방일</th>
              <th className="p-2">처방 개수</th>
              <th className="p-2">복용 시간</th>
              </tr>
            </thead>
            <tbody>
              {logItems.map(item => (
                <tr key={item.id}>
                  <td className="p-2"><input type="checkbox" checked={item.taken} onChange={() => handleCheckboxChange(item.id)} /></td>
                  <td className="p-2 text-blue-600">{item.medicine}</td>
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">{item.dose}</td>
                  <td className="p-2">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

       {/* 팝업 모달 (항목 추가) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">새 항목 추가</h3>
            
            {/* 복용약 입력 */}
            <label className="block mb-2">복용약</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="복용약 입력"
              value={newItem.medicine}
              onChange={(e) => setNewItem({ ...newItem, medicine: e.target.value })}
            />

            {/* 처방일 입력 */}
            <label className="block mb-2">처방일</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={newItem.date}
              onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
            />

            {/* 처방 개수 입력 */}
            <label className="block mb-2">처방 개수</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="처방 개수 입력"
              value={newItem.dose}
              onChange={(e) => setNewItem({ ...newItem, dose: e.target.value })}
            />

            {/* 복용 시간 선택 */}
            <label className="block mb-2">복용 시간</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2 mb-4"
              value={newItem.time}
              onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => 
                ["00", "30"].map(minute => (
                  <option key={`${hour}:${minute}`}>
                    {`${String(hour).padStart(2, '0')}:${minute}`}
                  </option>
                ))
              )}
            </select>

      {/* 추가/닫기 버튼 */}
      <div className="flex justify-end space-x-4">
      <button className="bg-blue-500 text-white py-2 px-4 rounded-lg" onClick={handleAddItem}>추가</button>
              <button onClick={toggleAddModal} className="bg-gray-500 text-white py-2 px-4 rounded-lg">닫기</button>
            </div>
    </div>
  </div>
)}



      </div>
    </div>
  );
};

export default UserDetail;
