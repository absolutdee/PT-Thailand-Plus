import React from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { FaPrint, FaDownload, FaEnvelope } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './InvoiceView.scss';

const InvoiceView = ({ invoiceData, showActions = true }) => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    status,
    customer,
    trainer,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    notes
  } = invoiceData;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`invoice-${invoiceNumber}.pdf`);
  };

  const handleSendEmail = () => {
    // Implement email sending logic
    console.log('Sending invoice via email...');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { text: 'ชำระแล้ว', class: 'bg-success' },
      pending: { text: 'รอชำระ', class: 'bg-warning' },
      overdue: { text: 'เกินกำหนด', class: 'bg-danger' },
      cancelled: { text: 'ยกเลิก', class: 'bg-secondary' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'bg-secondary' };
    
    return (
      <span className={`badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <Container className="invoice-container">
      {showActions && (
        <div className="invoice-actions mb-4">
          <Button variant="primary" onClick={handlePrint} className="me-2">
            <FaPrint className="me-2" />
            พิมพ์
          </Button>
          <Button variant="outline-primary" onClick={handleDownloadPDF} className="me-2">
            <FaDownload className="me-2" />
            ดาวน์โหลด PDF
          </Button>
          <Button variant="outline-primary" onClick={handleSendEmail}>
            <FaEnvelope className="me-2" />
            ส่งอีเมล
          </Button>
        </div>
      )}

      <Card className="invoice-card" id="invoice-content">
        <Card.Body>
          {/* Header */}
          <div className="invoice-header">
            <Row>
              <Col md={6}>
                <div className="company-info">
                  <h2 className="company-name">FitTrainer Pro</h2>
                  <p className="mb-0">123 ถนนสุขภาพ แขวงฟิตเนส</p>
                  <p className="mb-0">เขตออกกำลังกาย กรุงเทพฯ 10110</p>
                  <p className="mb-0">โทร: 02-123-4567</p>
                  <p className="mb-0">อีเมล: info@fittrainerpro.com</p>
                </div>
              </Col>
              <Col md={6} className="text-md-end">
                <h3 className="invoice-title">ใบแจ้งหนี้</h3>
                <div className="invoice-details">
                  <p className="mb-1">
                    <strong>เลขที่:</strong> {invoiceNumber}
                  </p>
                  <p className="mb-1">
                    <strong>วันที่:</strong> {new Date(invoiceDate).toLocaleDateString('th-TH')}
                  </p>
                  <p className="mb-1">
                    <strong>ครบกำหนด:</strong> {new Date(dueDate).toLocaleDateString('th-TH')}
                  </p>
                  <p className="mb-0">
                    <strong>สถานะ:</strong> {getStatusBadge(status)}
                  </p>
                </div>
              </Col>
            </Row>
          </div>

          <hr className="my-4" />

          {/* Bill To / From */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="bill-to">
                <h5>ลูกค้า</h5>
                <p className="mb-1"><strong>{customer.name}</strong></p>
                <p className="mb-1">{customer.email}</p>
                <p className="mb-1">{customer.phone}</p>
                {customer.address && <p className="mb-0">{customer.address}</p>}
              </div>
            </Col>
            <Col md={6}>
              <div className="bill-from">
                <h5>เทรนเนอร์</h5>
                <p className="mb-1"><strong>{trainer.name}</strong></p>
                <p className="mb-1">{trainer.email}</p>
                <p className="mb-1">{trainer.phone}</p>
                <p className="mb-0">ประเภท: {trainer.specialty}</p>
              </div>
            </Col>
          </Row>

          {/* Items Table */}
          <Table responsive className="invoice-table">
            <thead>
              <tr>
                <th>รายการ</th>
                <th>รายละเอียด</th>
                <th className="text-center">จำนวน</th>
                <th className="text-end">ราคาต่อหน่วย</th>
                <th className="text-end">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td className="text-muted">{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-end">฿{item.unitPrice.toFixed(2)}</td>
                  <td className="text-end">฿{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Summary */}
          <Row>
            <Col md={6}>
              {notes && (
                <div className="invoice-notes">
                  <h6>หมายเหตุ</h6>
                  <p className="text-muted">{notes}</p>
                </div>
              )}
              {paymentMethod && (
                <div className="payment-info">
                  <h6>วิธีการชำระเงิน</h6>
                  <p className="text-muted">{paymentMethod}</p>
                </div>
              )}
            </Col>
            <Col md={6}>
              <div className="invoice-summary">
                <table className="summary-table">
                  <tbody>
                    <tr>
                      <td>ยอดรวม:</td>
                      <td className="text-end">฿{subtotal.toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr className="text-success">
                        <td>ส่วนลด:</td>
                        <td className="text-end">-฿{discount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>ภาษี (7%):</td>
                      <td className="text-end">฿{tax.toFixed(2)}</td>
                    </tr>
                    <tr className="total-row">
                      <td><strong>ยอดชำระ:</strong></td>
                      <td className="text-end"><strong>฿{total.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Col>
          </Row>

          {/* Footer */}
          <div className="invoice-footer text-center mt-5">
            <p className="mb-0">ขอบคุณที่ใช้บริการ FitTrainer Pro</p>
            <p className="text-muted small">
              หากมีข้อสงสัยเกี่ยวกับใบแจ้งหนี้นี้ กรุณาติดต่อ support@fittrainerpro.com
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

// Compact version for lists
export const InvoiceCompact = ({ invoice, onView, onDownload }) => {
  const getStatusClass = (status) => {
    const statusClasses = {
      paid: 'text-success',
      pending: 'text-warning',
      overdue: 'text-danger',
      cancelled: 'text-secondary'
    };
    return statusClasses[status] || 'text-secondary';
  };

  return (
    <Card className="invoice-compact mb-2">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={2}>
            <small className="text-muted">เลขที่</small>
            <p className="mb-0 fw-bold">{invoice.invoiceNumber}</p>
          </Col>
          <Col md={3}>
            <small className="text-muted">ลูกค้า</small>
            <p className="mb-0">{invoice.customerName}</p>
          </Col>
          <Col md={2}>
            <small className="text-muted">วันที่</small>
            <p className="mb-0">{new Date(invoice.date).toLocaleDateString('th-TH')}</p>
          </Col>
          <Col md={2}>
            <small className="text-muted">ยอดเงิน</small>
            <p className="mb-0 fw-bold">฿{invoice.total.toFixed(2)}</p>
          </Col>
          <Col md={1}>
            <small className="text-muted">สถานะ</small>
            <p className={`mb-0 fw-bold ${getStatusClass(invoice.status)}`}>
              {invoice.statusText}
            </p>
          </Col>
          <Col md={2} className="text-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onView(invoice.id)}
              className="me-2"
            >
              ดู
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onDownload(invoice.id)}
            >
              <FaDownload />
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default InvoiceView;
