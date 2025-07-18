// ErrorBoundary.jsx
import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log error to error reporting service
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>เกิดข้อผิดพลาด</Alert.Heading>
            <p>
              ขออภัย เกิดข้อผิดพลาดบางอย่าง กรุณารีเฟรชหน้าหรือลองใหม่อีกครั้ง
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap' }} className="mt-3">
                <summary>รายละเอียดข้อผิดพลาด (Development Only)</summary>
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </details>
            )}
            <hr />
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={() => window.location.reload()}>
                รีเฟรชหน้า
              </Button>
              <Button variant="outline-primary" onClick={this.handleReset}>
                ลองใหม่
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
