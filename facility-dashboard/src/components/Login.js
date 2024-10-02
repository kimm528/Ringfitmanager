import React, { useState, useCallback } from "react";

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [modalUsername, setModalUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const credentials = btoa(`Dotories:DotoriesAuthorization0312983335`);

  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `https://fitlife.dotories.com/api/site?siteId=${username}`,
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
        if (data.data.sitePassword === password) {
          setIsLoggedIn(true);
          localStorage.setItem('isLoggedIn', 'true');
          alert("로그인 성공");
          setUsername("");
          setPassword("");
          setErrorMessage("");
        } else {
          setErrorMessage("비밀번호가 잘못되었습니다. 다시 시도하세요.");
        }
      } else {
        setErrorMessage(data.message || "로그인 실패. 다시 시도하세요.");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      setErrorMessage("서버와의 통신에 실패했습니다.");
    }
  }, [username, password, credentials, setIsLoggedIn]);

  const handleUpdatePassword = useCallback(async () => {
    if (!modalUsername || !password || !newPassword) {
      setErrorMessage("아이디, 현재 비밀번호, 새로운 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `https://fitlife.dotories.com/api/site?siteId=${modalUsername}`,
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
        if (data.data.sitePassword === password) {
          const updateResponse = await fetch(
            `https://fitlife.dotories.com/api/site`,
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
                  "siteId": modalUsername,
                  "sitePassword": newPassword,
                  "siteName": "윤섭센터~",
                  "disconnectInterval": 5
                }
              })
            }
          );

          const updateData = await updateResponse.json();

          if (updateResponse.ok && updateData.header.command === 0) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setIsModalOpen(false);
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
  }, [modalUsername, password, newPassword, credentials]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  }, [handleLogin]);

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

            <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown}>
              {/* Username Input */}
              <input
                type="text"
                className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              {/* Password Input */}
              <input
                type="password"
                className="mb-6 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Login Button */}
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex items-center justify-center w-full rounded-lg bg-blue-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg mt-0 relative"
                style={{ zIndex: 10 }}
              >
                로그인
              </button>

              {/* Password Update Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center w-full rounded-lg bg-green-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-green-600 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg mt-4 relative"
                style={{ zIndex: 10 }}
              >
                비밀번호 수정
              </button>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-red-500 mt-4">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold text-center mb-4">비밀번호 수정</h2>
            
            {/* Username Input */}
            <input
              type="text"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
              placeholder="아이디를 입력하세요"
              value={modalUsername}
              onChange={(e) => setModalUsername(e.target.value)}
            />

            {/* Current Password Input */}
            <input
              type="password"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
              placeholder="현재 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            {/* New Password Input */}
            <input
              type="password"
              className="mb-4 focus:outline-none focus:ring-0 appearance-none border border-gray-300 p-3 rounded-lg w-full"
              placeholder="새로운 비밀번호를 입력하세요"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            
            {/* Password Update Buttons */}
            <button
              type="button"
              onClick={handleUpdatePassword}
              className="inline-flex items-center justify-center w-full rounded-lg bg-blue-500 px-7 py-3 text-lg font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-blue-600 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg mt-4"
            >
              비밀번호 수정
            </button>

            {/* Error Message */}
            {errorMessage && (
              <div className="text-red-500 mt-4">
                {errorMessage}
              </div>
            )}

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setErrorMessage("");
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
