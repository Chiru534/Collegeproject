import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Admin() {
  const [form, setForm] = useState({ roll: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/auth/login', {
        ...form,
        isAdmin: true
      });
      
      if (res.data.success && res.data.user.isAdmin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          roll: res.data.user.roll,
          isAdmin: true
        }));
        setMessage('Admin login successful! Redirecting...');
        setTimeout(() => navigate('/home'), 1000); // Redirect to /home
      } else {
        setMessage('You are not authorized as admin.');
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
        <h2>Admin Login</h2>
        <div className="form-group">
          <input
            name="roll"
            type="text"
            placeholder="Admin Roll Number"
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
          {loading ? 'Logging in...' : 'Login as Admin'}
        </button>
        {message && <div className="message">{message}</div>}

        {/* Back to regular login */}
        <div style={{ marginTop: '15px' }}>
          <button
            type="button"
            style={{ 
              background: '#666',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/login')}
          >
            Back to User Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Admin;