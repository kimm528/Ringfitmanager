// Modal.js
import React from 'react';

const Modal = ({ onClose, children }) => {
  return (
    <div
      className="modal-overlay fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose} // 클릭 시 모달 닫기
    >
      <div
        className="modal-content bg-white rounded-lg shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫기 방지
      >
        {children}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Modal;
