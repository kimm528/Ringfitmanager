import React, { useState } from "react";
import { TEInput } from "tw-elements-react";
import { MdLogin } from "react-icons/md"; // 로그인 아이콘 추가

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState(""); // 사용자 아이디 입력
  const [password, setPassword] = useState(""); // 사용자 비밀번호 입력
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메시지 상태 추가
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
              <MdLogin size={50} className="mx-auto text-primary" />
              <h2 className="text-3xl font-bold">로그인</h2>
            </div>

            <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
{/* 아이디 입력 */}
<TEInput
  type="text"
  size="lg"
  className="mb-6 focus:outline-none focus:ring-0 appearance-none"
  placeholder="아이디를 입력하세요"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  style={{ boxShadow: "none", border: "none" }}  // 추가된 스타일
/>

{/* 비밀번호 입력 */}
<TEInput
  type="password"
  size="lg"
  className="mb-6 focus:outline-none focus:ring-0 appearance-none"
  placeholder="비밀번호를 입력하세요"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  style={{ boxShadow: "none", border: "none" }}  // 추가된 스타일
/>



{/* 로그인 버튼 */}
<button
  type="button"
  onClick={handleLogin}
  className="inline-flex items-center justify-center w-full rounded-lg bg-blue-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg mt-0 relative" // mt-2로 변경하여 더 위로 올림
  style={{ zIndex: 10 }} // z-index 설정
>
  <MdLogin size={24} className="mr-2" aria-hidden="true" />
  로그인
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
    </section>
  );
}
