import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import image1 from '../images/college_logo.png'; // Adjust the path as necessary

function Home() {
  return (
    <div className="home-container">
      <header className="top-header-container">
        <h1 className="top-header">ADARSH EDUCATIONAL INSTITUTIONS</h1>
      </header>
      <h4>Admin</h4>
      <img src={image1} alt="College Logo" className="college-logo" />
      <div className="boxes-container">
        <Link to="/upload" className="card">
          <h2>Results</h2>
          <p>Upload your PDF documents here.</p>
        </Link>
        <Link to="/upload-updates" className="card">
          <h2>Updates</h2>
          <p>Check for the latest updates.</p>
        </Link>
        <Link to="/students" className="card">
          <h2>Students</h2>
          <p>Access student information.</p>
        </Link>
      </div>
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Computer Science and Engineering (2022-2026)</p>
      </footer>
    </div>
  );
}

export default Home;