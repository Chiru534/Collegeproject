import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/forgot-password',
        { email }
      );
      setMessage(response.data.message);
      setError('');
      setShowOtpInput(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP');
      setMessage('');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/auth/verify-otp',
        { email, otp }
      );
      const { resetToken } = response.data;
      navigate(`/reset-password/${resetToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setMessage('');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      {!showOtpInput ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label>Enter OTP:</label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              required
            />
          </div>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Verify OTP</button>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;