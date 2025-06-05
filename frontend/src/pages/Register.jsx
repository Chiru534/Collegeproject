import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

function Register() {
  const [form, setForm] = useState({ roll: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/auth/register', {
        roll: form.roll,
        email: form.email,
        password: form.password,
      });
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      setMessage('Registration failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input
          name="roll"
          placeholder="Roll Number"
          value={form.roll}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
        <div className="message">{message}</div>
      </form>
    </div>
  );
}

export default Register;