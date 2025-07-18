// ConfirmationWrapper.jsx
import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export const ConfirmationContext = React.createContext();

export const ConfirmationProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState({});
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setConfig(options);
      setShow(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setShow(false);
    resolvePromise(true);
  };

  const handleCancel = () => {
    setShow(false);
    resolvePromise(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <Modal show={show} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>{config.title || 'ยืนยันการดำเนินการ'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {config.message || 'คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?'}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant={config.cancelVariant || 'secondary'} 
            onClick={handleCancel}
          >
            {config.cancelText || 'ยกเลิก'}
          </Button>
          <Button 
            variant={config.confirmVariant || 'primary'} 
            onClick={handleConfirm}
          >
            {config.confirmText || 'ยืนยัน'}
          </Button>
        </Modal.Footer>
      </Modal>
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = React.useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within ConfirmationProvider');
  }
  return context;
};
