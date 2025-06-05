import React from 'react';
import { Link } from 'react-router-dom';
import './UserHome.css';  // Make sure CSS filename matches

function UserHome() {
  return (
    <div className="user-home-container">
      <h1>Adarsh College of Engineering</h1>
      <img
        src="https://adarsh.ac.in/images/logos/college_logo.png"
        alt="Adarsh College of Engineering"
        className="college-logo"
      />
      <div style={{ marginTop: '30px' }}>
        <Link to="/login">
          <button style={{ marginRight: '15px', padding: '10px 30px', fontSize: '16px' }}>Login</button>
        </Link>
        <Link to="/register">
          <button style={{ padding: '10px 30px', fontSize: '16px' }}>Sign Up</button>
        </Link>
      </div>
    </div>
  );
}

export default UserHome;