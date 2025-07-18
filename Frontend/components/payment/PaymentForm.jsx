import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import { FaCreditCard, FaLock, FaCheckCircle } from 'react-icons/fa';
import { BsBank2, BsQrCode } from 'react-icons/bs';
import './PaymentForm.scss';

const PaymentForm = ({ packageData, trainerId, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    saveCard: false,
    promoCode: ''
  });

  const paymentMethods = [
    { id: 'credit_card', name: 'บัตรเครดิต/เดบิต', icon: FaCreditCard },
    { id: 'bank_transfer', name: 'โอนเงินผ่านธนาคาร', icon: BsBank2 },
    { id: 'promptpay', name: 'PromptPay QR', icon: BsQrCode }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod === 'credit_card') {
      if (!formData.cardNumber || formData.cardNumber.length < 16) {
        newErrors.cardNumber = 'กรุณากรอกหมายเลขบัตรให้ครบถ้วน';
      }
      if (!formData.cardName) {
        newErrors.cardName = 'กรุณากรอกชื่อผู้ถือบัตร';
      }
      if (!formData.expiryMonth || !formData.expiryYear) {
        newErrors.expiry = 'กรุณาเลือกวันหมดอายุ';
      }
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = 'กรุณากรอก CVV';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    // Format card number
    if (name === 'cardNumber') {
      processedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : processedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      
      // Call success callback after showing success message
      setTimeout(() => {
        onPaymentSuccess({
          paymentMethod,
          amount: packageData.price,
          packageId: packageData.id,
          trainerId,
          transactionId: 'TXN' + Date.now()
        });
      }, 2000);
    }, 2000);
  };

  const calculateTotal = () => {
    const subtotal = packageData.price;
    const discount = formData.promoCode ? subtotal * 0.1 : 0;
    const tax = (subtotal - discount) * 0.07;
    const total = subtotal - discount + tax;
    
    return {
      subtotal,
      discount,
      tax,
      total
    };
  };

  const { subtotal, discount, tax, total } = calculateTotal();

  return (
    <Container className="payment-form-container">
      <Row>
        <Col lg={8}>
          <Card className="payment-methods-card mb-4">
            <Card.Body>
              <h4 className="mb-4">เลือกวิธีการชำระเงิน</h4>
              
              <div className="payment-method-selector">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`payment-method-option ${paymentMethod === method.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <Icon size={24} />
                      <span>{method.name}</span>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          <Card className="payment-details-card">
            <Card.Body>
              {paymentMethod === 'credit_card' && (
                <Form onSubmit={handleSubmit}>
                  <h5 className="mb-4">ข้อมูลบัตรเครดิต</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>หมายเลขบัตร</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength="19"
                      isInvalid={!!errors.cardNumber}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.cardNumber}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>ชื่อผู้ถือบัตร</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardName"
                      placeholder="JOHN DOE"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      isInvalid={!!errors.cardName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.cardName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>วันหมดอายุ</Form.Label>
                        <Row>
                          <Col>
                            <Form.Select
                              name="expiryMonth"
                              value={formData.expiryMonth}
                              onChange={handleInputChange}
                              isInvalid={!!errors.expiry}
                            >
                              <option value="">เดือน</option>
                              {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>
                                  {String(i + 1).padStart(2, '0')}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col>
                            <Form.Select
                              name="expiryYear"
                              value={formData.expiryYear}
                              onChange={handleInputChange}
                              isInvalid={!!errors.expiry}
                            >
                              <option value="">ปี</option>
                              {[...Array(10)].map((_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                  <option key={i} value={year}>
                                    {year}
                                  </option>
                                );
                              })}
                            </Form.Select>
                          </Col>
                        </Row>
                        {errors.expiry && (
                          <div className="invalid-feedback d-block">
                            {errors.expiry}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CVV</Form.Label>
                        <Form.Control
                          type="text"
                          name="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          maxLength="4"
                          isInvalid={!!errors.cvv}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.cvv}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="saveCard"
                      label="บันทึกข้อมูลบัตรสำหรับการชำระเงินครั้งถัดไป"
                      checked={formData.saveCard}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Form>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="bank-transfer-info">
                  <h5 className="mb-4">ข้อมูลการโอนเงิน</h5>
                  <Alert variant="info">
                    <p><strong>ธนาคาร:</strong> กสิกรไทย</p>
                    <p><strong>ชื่อบัญชี:</strong> บริษัท ฟิตเทรนเนอร์ จำกัด</p>
                    <p><strong>เลขที่บัญชี:</strong> 123-456-7890</p>
                    <p><strong>จำนวนเงิน:</strong> {total.toFixed(2)} บาท</p>
                  </Alert>
                  <p className="text-muted">
                    กรุณาโอนเงินภายใน 24 ชั่วโมง และอัพโหลดสลิปการโอนเงิน
                  </p>
                </div>
              )}

              {paymentMethod === 'promptpay' && (
                <div className="promptpay-info text-center">
                  <h5 className="mb-4">สแกน QR Code เพื่อชำระเงิน</h5>
                  <div className="qr-code-placeholder">
                    <BsQrCode size={200} color="#232956" />
                  </div>
                  <p className="mt-3">
                    <strong>จำนวนเงิน: {total.toFixed(2)} บาท</strong>
                  </p>
                  <p className="text-muted">
                    กรุณาชำระเงินภายใน 15 นาที
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="order-summary-card">
            <Card.Body>
              <h5 className="mb-4">สรุปการสั่งซื้อ</h5>
              
              <div className="package-info mb-4">
                <h6>{packageData.name}</h6>
                <p className="text-muted mb-0">{packageData.description}</p>
                <p className="text-muted">ระยะเวลา: {packageData.duration}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="promoCode"
                  placeholder="รหัสส่วนลด"
                  value={formData.promoCode}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>ราคาแพคเกจ</span>
                  <span>{subtotal.toFixed(2)} บาท</span>
                </div>
                {discount > 0 && (
                  <div className="price-row text-success">
                    <span>ส่วนลด</span>
                    <span>-{discount.toFixed(2)} บาท</span>
                  </div>
                )}
                <div className="price-row">
                  <span>ภาษี (7%)</span>
                  <span>{tax.toFixed(2)} บาท</span>
                </div>
                <hr />
                <div className="price-row total">
                  <strong>ยอดรวมทั้งหมด</strong>
                  <strong>{total.toFixed(2)} บาท</strong>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100 mt-4 payment-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>กำลังประมวลผล...</>
                ) : (
                  <>
                    <FaLock className="me-2" />
                    ชำระเงิน {total.toFixed(2)} บาท
                  </>
                )}
              </Button>

              <p className="security-note text-center mt-3 text-muted">
                <FaLock size={12} className="me-1" />
                การชำระเงินของคุณได้รับการปกป้องด้วย SSL 256-bit
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal show={showSuccess} centered size="sm">
        <Modal.Body className="text-center py-5">
          <FaCheckCircle size={60} color="#28a745" className="mb-3" />
          <h4>ชำระเงินสำเร็จ!</h4>
          <p>กำลังนำคุณไปยังหน้าถัดไป...</p>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PaymentForm;
