import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login({ onLogin }) {
  const [form, setForm] = useState({ roll: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/auth/login', form);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          roll: res.data.user.roll,
          isAdmin: false
        }));
        setMessage('Login successful!');
        if (onLogin) onLogin(res.data.user.roll);
        navigate('/student-home'); // Redirect to student home page
      } else {
        setMessage('Login failed: ' + (res.data.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div className="form-group">
          <input
            name="roll"
            type="text"
            placeholder="Roll Number"
            value={form.roll}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {message && <div className="message">{message}</div>}

        {/* Add links for regular user features */}
        <div className="auth-links" style={{ marginTop: '15px' }}>
          <Link to="/register" style={{ marginRight: '15px' }}>Register</Link>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div style={{ marginTop: '18px' }}>
          <button
            type="button"
            style={{ 
              background: '#333',
              color: '#fff',
              padding: '8px 24px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/admin')}
          >
            Admin Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;