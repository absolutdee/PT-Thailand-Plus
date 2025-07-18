import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaCreditCard, FaCheckCircle, FaTrash, FaEdit } from 'react-icons/fa';
import { BsCreditCard2Back, BsBank2 } from 'react-icons/bs';
import './PaymentMethodCard.scss';

const PaymentMethodCard = ({ 
  method, 
  isDefault, 
  onSetDefault, 
  onEdit, 
  onDelete,
  className = "" 
}) => {
  const getCardIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'visa':
        return <img src="/images/visa.svg" alt="Visa" className="card-brand-icon" />;
      case 'mastercard':
        return <img src="/images/mastercard.svg" alt="Mastercard" className="card-brand-icon" />;
      case 'amex':
        return <img src="/images/amex.svg" alt="Amex" className="card-brand-icon" />;
      case 'bank':
        return <BsBank2 size={24} />;
      default:
        return <BsCreditCard2Back size={24} />;
    }
  };

  const getMethodTypeName = (type) => {
    switch (type) {
      case 'credit_card':
        return 'บัตรเครดิต';
      case 'debit_card':
        return 'บัตรเดบิต';
      case 'bank_account':
        return 'บัญชีธนาคาร';
      default:
        return 'วิธีการชำระเงิน';
    }
  };

  return (
    <Card className={`payment-method-card ${isDefault ? 'default' : ''} ${className}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <div className="payment-icon me-3">
              {getCardIcon(method.cardType || method.type)}
            </div>
            <div>
              <h6 className="mb-0">
                {method.type === 'bank_account' ? method.bankName : method.cardType?.toUpperCase()}
              </h6>
              <small className="text-muted">{getMethodTypeName(method.type)}</small>
            </div>
          </div>
          {isDefault && (
            <Badge bg="success" className="default-badge">
              <FaCheckCircle className="me-1" size={12} />
              ค่าเริ่มต้น
            </Badge>
          )}
        </div>

        <div className="method-details">
          {method.type === 'credit_card' || method.type === 'debit_card' ? (
            <>
              <p className="mb-1">
                <span className="text-muted">หมายเลขบัตร:</span>{' '}
                <strong>•••• •••• •••• {method.last4Digits}</strong>
              </p>
              <p className="mb-1">
                <span className="text-muted">ชื่อผู้ถือบัตร:</span>{' '}
                <strong>{method.cardholderName}</strong>
              </p>
              <p className="mb-0">
                <span className="text-muted">หมดอายุ:</span>{' '}
                <strong>{method.expiryMonth}/{method.expiryYear}</strong>
              </p>
            </>
          ) : method.type === 'bank_account' ? (
            <>
              <p className="mb-1">
                <span className="text-muted">ธนาคาร:</span>{' '}
                <strong>{method.bankName}</strong>
              </p>
              <p className="mb-1">
                <span className="text-muted">เลขที่บัญชี:</span>{' '}
                <strong>•••••••{method.last4Digits}</strong>
              </p>
              <p className="mb-0">
                <span className="text-muted">ชื่อบัญชี:</span>{' '}
                <strong>{method.accountName}</strong>
              </p>
            </>
          ) : null}
        </div>

        <div className="action-buttons">
          {!isDefault && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onSetDefault(method.id)}
              className="me-2"
            >
              ตั้งเป็นค่าเริ่มต้น
            </Button>
          )}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onEdit(method.id)}
            className="me-2"
          >
            <FaEdit size={14} />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(method.id)}
          >
            <FaTrash size={14} />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

// Component for adding new payment method
export const AddPaymentMethodCard = ({ onClick }) => {
  return (
    <Card 
      className="payment-method-card add-new-card" 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Card.Body className="text-center">
        <div className="add-icon-wrapper">
          <FaCreditCard size={32} color="#232956" />
        </div>
        <h6 className="mt-3 mb-1">เพิ่มวิธีการชำระเงิน</h6>
        <small className="text-muted">บัตรเครดิต/เดบิต หรือบัญชีธนาคาร</small>
      </Card.Body>
    </Card>
  );
};

// List component for multiple payment methods
export const PaymentMethodList = ({ 
  methods, 
  defaultMethodId, 
  onSetDefault, 
  onEdit, 
  onDelete,
  onAddNew 
}) => {
  return (
    <div className="payment-method-list">
      <div className="row">
        {methods.map((method) => (
          <div key={method.id} className="col-md-6 col-lg-4 mb-3">
            <PaymentMethodCard
              method={method}
              isDefault={method.id === defaultMethodId}
              onSetDefault={onSetDefault}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
        <div className="col-md-6 col-lg-4 mb-3">
          <AddPaymentMethodCard onClick={onAddNew} />
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodCard;
