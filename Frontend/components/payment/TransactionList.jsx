import React, { useState } from 'react';
import { 
  Container, 
  Card, 
  Table, 
  Badge, 
  Button, 
  Form, 
  Row, 
  Col,
  Pagination,
  Dropdown,
  Modal
} from 'react-bootstrap';
import { 
  FaFilter, 
  FaDownload, 
  FaEye, 
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './TransactionList.scss';

const TransactionList = ({ 
  transactions = [], 
  onViewDetails, 
  onDownloadReceipt,
  showFilters = true,
  itemsPerPage = 10 
}) => {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    paymentMethod: 'all',
    dateFrom: null,
    dateTo: null,
    amountMin: '',
    amountMax: ''
  });

  // Get status icon and color
  const getStatusInfo = (status) => {
    const statusMap = {
      success: { 
        icon: FaCheckCircle, 
        color: 'success', 
        text: 'สำเร็จ' 
      },
      pending: { 
        icon: FaClock, 
        color: 'warning', 
        text: 'รอดำเนินการ' 
      },
      failed: { 
        icon: FaTimesCircle, 
        color: 'danger', 
        text: 'ล้มเหลว' 
      },
      refunded: { 
        icon: FaReceipt, 
        color: 'info', 
        text: 'คืนเงิน' 
      }
    };
    
    return statusMap[status] || statusMap.pending;
  };

  // Payment method display
  const getPaymentMethodDisplay = (method) => {
    const methodMap = {
      credit_card: 'บัตรเครดิต',
      debit_card: 'บัตรเดบิต',
      bank_transfer: 'โอนเงิน',
      promptpay: 'PromptPay',
      cash: 'เงินสด'
    };
    
    return methodMap[method] || method;
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(t => 
        t.transactionId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    
    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= filters.dateTo);
    }
    
    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(t => t.amount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(t => t.amount <= parseFloat(filters.amountMax));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      paymentMethod: 'all',
      dateFrom: null,
      dateTo: null,
      amountMin: '',
      amountMax: ''
    });
  };

  return (
    <Container fluid className="transaction-list-container">
      {showFilters && (
        <Card className="filter-card mb-4">
          <Card.Body>
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>ค้นหา</Form.Label>
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <Form.Control
                      type="text"
                      placeholder="ค้นหาด้วยเลขที่ธุรกรรม, ชื่อลูกค้า..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>สถานะ</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="success">สำเร็จ</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="failed">ล้มเหลว</option>
                    <option value="refunded">คืนเงิน</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>วิธีชำระเงิน</Form.Label>
                  <Form.Select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="credit_card">บัตรเครดิต</option>
                    <option value="debit_card">บัตรเดบิต</option>
                    <option value="bank_transfer">โอนเงิน</option>
                    <option value="promptpay">PromptPay</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="outline-primary"
                  onClick={() => setShowFilterModal(true)}
                  className="me-2"
                >
                  <FaFilter className="me-2" />
                  ตัวกรองเพิ่มเติม
                </Button>
                <Button
                  variant="primary"
                  onClick={applyFilters}
                  className="me-2"
                >
                  ค้นหา
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={resetFilters}
                >
                  ล้าง
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">รายการธุรกรรม ({filteredTransactions.length})</h5>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                <FaDownload className="me-2" />
                ส่งออก
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => console.log('Export CSV')}>
                  ส่งออก CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={() => console.log('Export Excel')}>
                  ส่งออก Excel
                </Dropdown.Item>
                <Dropdown.Item onClick={() => console.log('Export PDF')}>
                  ส่งออก PDF
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <Table responsive hover className="transaction-table">
            <thead>
              <tr>
                <th onClick={() => setSortBy('transactionId')}>
                  เลขที่ธุรกรรม
                </th>
                <th onClick={() => setSortBy('date')}>
                  วันที่
                </th>
                <th>ลูกค้า</th>
                <th>รายละเอียด</th>
                <th>วิธีชำระ</th>
                <th onClick={() => setSortBy('amount')} className="text-end">
                  จำนวนเงิน
                </th>
                <th className="text-center">สถานะ</th>
                <th className="text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((transaction) => {
                const statusInfo = getStatusInfo(transaction.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={transaction.id}>
                    <td className="transaction-id">
                      {transaction.transactionId}
                    </td>
                    <td>
                      {new Date(transaction.date).toLocaleDateString('th-TH')}
                      <br />
                      <small className="text-muted">
                        {new Date(transaction.date).toLocaleTimeString('th-TH')}
                      </small>
                    </td>
                    <td>
                      <div>
                        <strong>{transaction.customerName}</strong>
                        <br />
                        <small className="text-muted">{transaction.customerEmail}</small>
                      </div>
                    </td>
                    <td>{transaction.description}</td>
                    <td>
                      <Badge bg="secondary">
                        {getPaymentMethodDisplay(transaction.paymentMethod)}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <strong>฿{transaction.amount.toFixed(2)}</strong>
                    </td>
                    <td className="text-center">
                      <Badge bg={statusInfo.color}>
                        <StatusIcon size={12} className="me-1" />
                        {statusInfo.text}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onViewDetails(transaction.id)}
                        className="me-1"
                      >
                        <FaEye />
                      </Button>
                      {transaction.status === 'success' && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => onDownloadReceipt(transaction.id)}
                        >
                          <FaReceipt />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Advanced Filter Modal */}
      <Modal 
        show={showFilterModal} 
        onHide={() => setShowFilterModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>ตัวกรองขั้นสูง</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>วันที่เริ่มต้น</Form.Label>
                <DatePicker
                  selected={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="เลือกวันที่"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>วันที่สิ้นสุด</Form.Label>
                <DatePicker
                  selected={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="เลือกวันที่"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>จำนวนเงินขั้นต่ำ</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0.00"
                  value={filters.amountMin}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>จำนวนเงินสูงสุด</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0.00"
                  value={filters.amountMax}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFilterModal(false)}>
            ยกเลิก
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              applyFilters();
              setShowFilterModal(false);
            }}
          >
            ใช้ตัวกรอง
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TransactionList;
