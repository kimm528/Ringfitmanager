import React, { useState } from "react";
import { TEInput } from "tw-elements-react";

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState(""); // 로그인 화면에서 입력한 아이디
  const [password, setPassword] = useState(""); // 비밀번호 입력
  const [newPassword, setNewPassword] = useState(""); // 새로운 비밀번호 입력
  const [modalUsername, setModalUsername] = useState(""); // 모달에서 입력한 아이디
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메시지 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 열림/닫힘 상태
  const credentials = btoa(`${'Dotories'}:${'DotoriesAuthorization0312983335'}`);  // Base64로 인코딩

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }
  
    try {
      // 서버에 GET 요청 보내기
      const response = await fetch(
        `https://dotoriesringcloudserver.azurewebsites.net/api/site?siteId=${username}`,
        //`https://dotoriesringcloudserver.azurewebsites.net/api/user?siteId=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${credentials}`
          }
        }
      );
  
      const data = await response.json();
  
      // 응답 데이터 처리
      if (response.ok && data.header.command === 0) {
        // 서버에서 받은 sitePassword와 사용자가 입력한 password 비교
        if (data.data.sitePassword === password) {
          setIsLoggedIn(true); // 로그인 성공 처리
          alert("로그인 성공");
          // 로그인 후 입력 필드 초기화
          setUsername("");
          setPassword("");
          setErrorMessage("");
        } else {
          // 비밀번호가 틀린 경우 처리
          setErrorMessage("비밀번호가 잘못되었습니다. 다시 시도하세요.");
        }
      } else {
        setErrorMessage(data.message || "로그인 실패. 다시 시도하세요.");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      setErrorMessage("서버와의 통신에 실패했습니다.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!modalUsername || !password || !newPassword) {
      setErrorMessage("아이디, 현재 비밀번호, 새로운 비밀번호를 입력해주세요.");
      return;
    }

    try {
      // 현재 비밀번호 확인을 위해 GET 요청
      const response = await fetch(
        `https://dotoriesringcloudserver.azurewebsites.net/api/site?siteId=${modalUsername}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${credentials}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.header.command === 0) {
        // 현재 비밀번호 확인
        if (data.data.sitePassword === password) {
          // 비밀번호 업데이트 요청
          const updateResponse = await fetch(
            `https://dotoriesringcloudserver.azurewebsites.net/api/site`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${credentials}`
              },
              body: JSON.stringify({
                "header": {
                    "command": 0
                },
                "data": {
                    "siteId": `${modalUsername}`,
                    "sitePassword": `${newPassword}`,
                    "siteName": "윤섭센터~",
                    "disconnectInterval": 5
                }
            })
            }
          );

          const updateData = await updateResponse.json();

          if (updateResponse.ok && updateData.header.command === 0) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setIsModalOpen(false); // 모달 닫기
            // 모달 입력 필드 초기화
            setModalUsername("");
            setPassword("");
            setNewPassword("");
            setErrorMessage("");
          } else {
            setErrorMessage(updateData.message || "비밀번호 변경에 실패했습니다. 다시 시도하세요.");
          }
        } else {
          setErrorMessage("현재 비밀번호가 올바르지 않습니다.");
        }
      } else {
        setErrorMessage(data.message || "아이디를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("비밀번호 변경 중 오류 발생:", error);
      setErrorMessage("서버와의 통신에 실패했습니다.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <section className="h-screen">
      <div className="container h-full px-6 py-24">
        <div className="g-6 flex h-full flex-wrap items-center justify-center lg:justify-between">
          {/* Left column container with background */}
          <div className="mb-12 md:mb-0 md:w-8/12 lg:w-6/12">
            <img
              src={`${process.env.PUBLIC_URL}/health_illustration.png`}
              className="w-full"
              alt="Health Care Illustration"
            />
          </div>

          {/* Right column container with form */}
          <div className="md:w-8/12 lg:ml-6 lg:w-5/12">
            {/* 로그인 제목과 아이콘 */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold">로그인</h2>
            </div>

            <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
              {/* 아이디 입력 */}
<input
  type="text"
  className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
  placeholder="아이디를 입력하세요"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

{/* 비밀번호 입력 */}
<input
  type="password"
  className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
  placeholder="비밀번호를 입력하세요"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

              {/* 로그인 버튼 */}
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex items-center justify-center w-full rounded-lg bg-blue-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg mt-0 relative"
                style={{ zIndex: 10 }} // z-index 설정
              >
                로그인
              </button>

              {/* 비밀번호 수정 버튼 */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)} // 모달 열기
                className="inline-flex items-center justify-center w-full rounded-lg bg-green-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-green-600 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg mt-4 relative"
                style={{ zIndex: 10 }} // z-index 설정
              >
                비밀번호 수정
              </button>

              {/* 에러 메시지 출력 */}
              {errorMessage && (
                <div className="text-red-500 mt-4">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 비밀번호 수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold text-center mb-4">비밀번호 수정</h2>
            
            {/* 아이디 입력 */}
            <TEInput
              type="text"
              size="lg"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none"
              placeholder="아이디를 입력하세요"
              value={modalUsername}
              onChange={(e) => setModalUsername(e.target.value)}
              style={{ boxShadow: "none", border: "none" }}
            />

            {/* 현재 비밀번호 입력 */}
            <TEInput
              type="password"
              size="lg"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none"
              placeholder="현재 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ boxShadow: "none", border: "none" }}
            />
            
            {/* 새로운 비밀번호 입력 */}
            <TEInput
              type="password"
              size="lg"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none"
              placeholder="새로운 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ boxShadow: "none", border: "none" }}
            />
            
            {/* 비밀번호 수정 확인 버튼 */}
            <button
              type="button"
              onClick={handleUpdatePassword} // 비밀번호 변경 함수 호출
              className="inline-flex items-center justify-center w-full rounded-lg bg-blue-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg mt-4"
            >
              비밀번호 수정
            </button>

            {/* 에러 메시지 출력 */}
            {errorMessage && (
              <div className="text-red-500 mt-4">
                {errorMessage}
              </div>
            )}

            {/* 모달 닫기 버튼 */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false); // 모달 닫기
                setErrorMessage("");    // 에러 메시지 초기화
              }}
              className="inline-flex items-center justify-center w-full rounded-lg bg-gray-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-gray-600 hover:shadow-lg focus:bg-gray-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-gray-800 active:shadow-lg mt-4"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
