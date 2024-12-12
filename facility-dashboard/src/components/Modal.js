// Modal.js
import React, { forwardRef } from 'react';

const Modal = forwardRef(({ onClose, children }, ref) => {
  return (
    <div
      className="modal-overlay fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center"
      style={{ zIndex: 9999 }}
    >
      <div
        ref={ref}
        className="modal-content bg-white rounded-lg shadow-lg p-6 relative"
        style={{ zIndex: 10000 }}
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
});

export default Modal;
