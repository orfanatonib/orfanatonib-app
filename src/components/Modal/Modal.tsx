import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  onClose: () => void;
  shelteredren: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, shelteredren }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✖
        </button>
        {shelteredren}
      </div>
    </div>
  );
};

export default Modal;
