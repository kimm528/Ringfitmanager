// src/components/Login.js

import React, { useState, useCallback } from "react";

export default function Login({ setIsLoggedIn, setSiteId }) {
  // State for login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  // State for sign-up modal
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signUpSiteId, setSignUpSiteId] = useState("");
  const [signUpAdminId, setSignUpAdminId] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpErrorMessage, setSignUpErrorMessage] = useState("");

  const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);
  //const url = 'http://14.47.20.111:7201'
  const url = 'https://fitlife.dotories.com';

  // 세션 스토리지 관련 헬퍼 함수
  const loadFromSessionStorage = (key, defaultValue) => {
    if (key === 'users') return defaultValue;
    const stored = sessionStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error parsing sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  };

  // useEffect에서 새로고침 코드 제거
  // 새로고침 없이도 상태가 제대로 관리되도록 수정
  /*
  useEffect(() => {
    // 처음 진입 시 한 번만 새로 고침을 하도록 sessionStorage에 값을 저장
    const isFirstLogin = sessionStorage.getItem('isFirstLogin');
    
    if (!isFirstLogin) {
      sessionStorage.setItem('isFirstLogin', 'true'); // 로그인 후 처음 진입으로 설정
      window.location.reload(); // 새로 고침
    }
  }, []); // 의존성 배열에 빈 배열을 넣어 컴포넌트가 처음 렌더링될 때만 실행
  */

  const formattedTime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');

    const yy = pad(date.getFullYear() % 100); // 연도 (마지막 2자리)
    const MM = pad(date.getMonth() + 1); // 월 (0부터 시작하므로 +1)
    const dd = pad(date.getDate()); // 일
    const HH = pad(date.getHours()); // 시
    const mm = pad(date.getMinutes()); // 분
    const ss = pad(date.getSeconds()); // 초

    return `${yy}${MM}${dd}${HH}${mm}${ss}`;
  };

  const saveToSessionStorage = (key, value) => {
    if (key === 'users') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  // Handle login
  const handleLogin = useCallback(async (e) => {
    e.preventDefault(); // Form 기본 동작 방지

    if (isLoading) return; // 이미 로딩 중이면 함수 종료

    if (!username || !password) {
      setLoginErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true); // 로딩 시작

    try {
      // 서버 요청
      const response = await fetch(
        `${url}/api/manager?id=${username}&password=${password}&time=${formattedTime(new Date())}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 응답 데이터 파싱
      let data = await response.json();

      // 만약 data가 문자열이라면, 두 번째 파싱 시도
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      // 응답 상태 확인
      if (response.ok) {
        setIsLoggedIn(true);

        // siteId 추출 및 저장
        const siteId = data.Header?.SiteId || data.Data?.[0]?.SiteId || "";
        setSiteId(siteId);
        sessionStorage.setItem("siteId", siteId);

        // 기타 정보 저장
        sessionStorage.setItem("adminId", username);
        sessionStorage.setItem("isLoggedIn", JSON.stringify(true));
        alert("로그인 성공");
        setUsername("");
        setPassword("");
        setLoginErrorMessage("");
      } else {
        setLoginErrorMessage("로그인 실패. 다시 시도하세요.");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      setLoginErrorMessage("서버와의 통신에 실패했습니다.");
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  }, [username, password, credentials, setIsLoggedIn, setSiteId, isLoading]);

  // Handle sign-up (변경 없음)
  const handleSignUp = useCallback(async (e) => {
    e.preventDefault(); // Prevent form submission default behavior

    if (!signUpSiteId || !signUpAdminId || !signUpPassword || !signUpName) {
      setSignUpErrorMessage("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `${url}/api/manager`,
        {
          method: "INSERT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${credentials}`
          },
          body: JSON.stringify({
            header: {
              // siteId 추가
            },
            data: {
              AdminId: signUpAdminId,
              Password: signUpPassword,
              siteId: signUpSiteId,
              Name: signUpName
            }
          }),
        }
      );

      let data;

      // 첫 번째 파싱 시도
      try {
        data = await response.json();
        console.log("첫 번째 파싱 결과:", data);

        // 만약 data가 문자열이라면, 두 번째 파싱 시도
        if (typeof data === 'string') {
          data = JSON.parse(data);
          console.log("두 번째 파싱 결과:", data);
        }
      } catch (jsonError) {
        // JSON 파싱 실패 시 텍스트로 가져와서 다시 파싱 시도
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
          console.log("회원가입 응답 데이터 (텍스트 파싱):", data);

          if (typeof data === 'string') {
            data = JSON.parse(data);
            console.log("회원가입 응답 데이터 (이중 파싱):", data);
          }
        } catch (parseError) {
          console.error("응답 데이터 파싱 실패:", parseError);
          setSignUpErrorMessage("회원가입 실패. 응답 데이터 형식이 올바르지 않습니다.");
          return;
        }
      }

      // 디버깅용 로그
      console.log("회원가입 응답 데이터:", data);
      console.log("데이터 타입:", typeof data);

      if (response.ok) {
        // 서버에서 status 필드로 중복 여부 반환
        if (true) { 
          alert("회원가입이 성공적으로 완료되었습니다.");
          setIsSignUpModalOpen(false);
          setSignUpSiteId("");
          setSignUpAdminId("");
          setSignUpPassword("");
          setSignUpName("");
          setSignUpErrorMessage("");
        } else {
          // 기타 오류 처리
          setSignUpErrorMessage("회원가입에 실패했습니다. 다시 시도하세요.");
        }
      } else {
        // response.ok가 false일 때, 오류 응답을 파싱하여 처리
        if (data.status === "ExistsId") {
          // 아이디 중복 오류 처리
          setSignUpErrorMessage("아이디가 이미 존재합니다. 다른 아이디를 사용해주세요.");
        } else {
          setSignUpErrorMessage(data.message || "회원가입에 실패했습니다. 다시 시도하세요.");
        }
      }
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      setSignUpErrorMessage("서버와의 통신에 실패했습니다.");
    }
  }, [signUpSiteId, signUpAdminId, signUpPassword, signUpName, credentials]);

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
            {/* Login Title */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold">로그인</h2>
            </div>

            <form onSubmit={handleLogin}>
              {/* Username Input */}
              <input
                type="text"
                className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="아이디 입력"
                disabled={isLoading} // 로딩 중일 때 입력 비활성화 (선택 사항)
              />

              {/* Password Input */}
              <input
                type="password"
                className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="비밀번호 입력"
                disabled={isLoading} // 로딩 중일 때 입력 비활성화 (선택 사항)
              />

              {/* Login Button */}
              <button
                type="submit"
                className={`inline-flex items-center justify-center w-full rounded-lg px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out relative ${
                  isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                style={{ zIndex: 10 }}
                disabled={isLoading} // 로딩 중일 때 버튼 비활성화
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              {/* Sign Up Button */}
              <button
                type="button"
                onClick={() => setIsSignUpModalOpen(true)}
                className="inline-flex items-center justify-center w-full rounded-lg bg-purple-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-purple-600 mt-4 relative"
                style={{ zIndex: 10 }}
                disabled={isLoading} // 로딩 중일 때 버튼 비활성화 (선택 사항)
              >
                회원가입
              </button>

              {/* Login Error Message */}
              {loginErrorMessage && (
                <div className="text-red-500 mt-4">
                  {loginErrorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Sign Up Modal */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold text-center mb-4">회원가입</h2>

            <form onSubmit={handleSignUp}>
              {/* siteId Input */}
              <input
                type="text"
                className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="siteId를 입력하세요"
                value={signUpSiteId}
                onChange={(e) => setSignUpSiteId(e.target.value)}
                aria-label="siteId 입력"
              />

              {/* AdminId Input */}
              <input
                type="text"
                className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="관리자 아이디를 입력하세요"
                value={signUpAdminId}
                onChange={(e) => setSignUpAdminId(e.target.value)}
                aria-label="관리자 아이디 입력"
              />

              {/* Password Input */}
              <input
                type="password"
                className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="비밀번호를 입력하세요"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                aria-label="비밀번호 입력"
              />

              {/* Name Input */}
              <input
                type="text"
                className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="이름을 입력하세요"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                aria-label="이름 입력"
              />

              {/* Sign Up Button */}
              <button
                type="submit"
                className="inline-flex items-center justify-center w-full rounded-lg bg-purple-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-purple-600"
              >
                회원가입
              </button>

              {/* Sign Up Error Message */}
              {signUpErrorMessage && (
                <div className="text-red-500 mt-4">
                  {signUpErrorMessage}
                </div>
              )}

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSignUpModalOpen(false);
                  setSignUpSiteId("");
                  setSignUpAdminId("");
                  setSignUpPassword("");
                  setSignUpName("");
                  setSignUpErrorMessage("");
                }}
                className="inline-flex items-center justify-center w-full rounded-lg bg-gray-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-gray-600 mt-4"
              >
                닫기
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
