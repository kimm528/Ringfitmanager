// src/components/Login.js

import React, { useState, useCallback } from "react";
import Cookies from 'js-cookie'; // js-cookie 임포트

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

        Cookies.set("isLoggedIn", "true", { 
          domain: '.dotories.com', // 모든 서브도메인에서 접근 가능하도록 설정
          path: '/', 
          sameSite: 'None',       // 교차 사이트 요청에서도 전송 가능
          secure: true            // HTTPS에서만 전송
        });
        Cookies.set("siteId", siteId, { 
          domain: '.dotories.com', 
          path: '/', 
          sameSite: 'None', 
          secure: true 
        });
        Cookies.set("adminId", username, { 
          domain: '.dotories.com', 
          path: '/', 
          sameSite: 'None', 
          secure: true 
        });

        console.log('쿠키가 설정되었습니다:', {
          isLoggedIn: Cookies.get('isLoggedIn'),
          siteId: Cookies.get('siteId'),
          adminId: Cookies.get('adminId'),
        });

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

        // 만약 data가 문자열이라면, ��� 번째 파싱 시도
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
        if (data.status !== "ExistsId") { 
          alert("회원가입이 성공적으로 완료되었습니다.");
          setIsSignUpModalOpen(false);
          setSignUpSiteId("");
          setSignUpAdminId("");
          setSignUpPassword("");
          setSignUpName("");
          setSignUpErrorMessage("");
        } else {
          // 아이디 중복 오류 처리
          setSignUpErrorMessage("아이디가 이미 존재합니다. 다른 아이디를 사용해주세요.");
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
    <section className="min-h-screen bg-gray-50 flex flex-col py-8">
      <div className="container mx-auto px-4 flex-grow flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
          {/* 로고 이미지 컨테이너 */}
          <div className="w-full lg:w-5/12 flex justify-center">
            <img
              src={`${process.env.PUBLIC_URL}/AiFit Manager Icon_Round Type.png`}
              className="w-3/4 max-w-sm object-contain"
              alt="aiFitManager"
            />
          </div>

          {/* 로그인 폼 컨테이너 */}
          <div className="w-full lg:w-5/12">
            {/* 로그인 타이틀 */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold">로그인</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* 아이디 입력 */}
              <input
                type="text"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="아이디 입력"
                disabled={isLoading}
              />

              {/* 비밀번호 입력 */}
              <input
                type="password"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="비밀번호 입력"
                disabled={isLoading}
              />

              {/* 로그인 버튼 */}
              <button
                type="submit"
                className={`w-full py-3 text-lg font-semibold text-white rounded-lg transition duration-150 ease-in-out ${
                  isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4zm2 5.29V12H2a8 8 0 008 8v-2.71A5.96 5.96 0 016 17.29z"
                      ></path>
                    </svg>
                    로그인 중...
                  </div>
                ) : (
                  '로그인'
                )}
              </button>

              {/* 회원가입 버튼 */}
              <button
                type="button"
                onClick={() => setIsSignUpModalOpen(true)}
                className="w-full py-3 text-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition duration-150 ease-in-out"
                disabled={isLoading}
              >
                회원가입
              </button>

              {loginErrorMessage && (
                <div className="text-red-500 text-center mt-2 text-sm">
                  {loginErrorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 회원가입 모달 */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="flex items-center justify-center min-h-full p-4">
            <div className="relative w-full max-w-md my-6">
              <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                {/* 헤더 영역 */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-center">회원가입</h2>
                </div>

                {/* 폼 영역 */}
                <div className="px-6 py-4">
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          사이트 ID
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="siteId를 입력하세요"
                          value={signUpSiteId}
                          onChange={(e) => setSignUpSiteId(e.target.value)}
                          aria-label="siteId 입력"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          관리자 ID
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="관리자 아이디를 입력하세요"
                          value={signUpAdminId}
                          onChange={(e) => setSignUpAdminId(e.target.value)}
                          aria-label="관리자 아이디 입력"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비밀번호
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="비밀번호를 입력하세요"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          aria-label="비밀번호 입력"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이름
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="이름을 입력하세요"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          aria-label="이름 입력"
                        />
                      </div>
                    </div>

                    {signUpErrorMessage && (
                      <div className="text-red-500 text-center mt-4">
                        {signUpErrorMessage}
                      </div>
                    )}
                  </form>
                </div>

                {/* 버튼 영역 */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="w-full py-3 text-base font-semibold text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition duration-150 ease-in-out mb-3"
                  >
                    회원가입
                  </button>

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
                    className="w-full py-3 text-base font-semibold text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition duration-150 ease-in-out"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
