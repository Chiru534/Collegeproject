import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <header className="top-header-container">
        <img src="https://adarsh.ac.in/images/logos/college_logo.png" alt="College Logo" />
        <h1 className="top-header">ADARSH COLLEGE OF ENGINEERING</h1>
      </header>
      <p>This is the home page of our application.</p>
      <div className="home-actions">
        <Link to="/upload">
          <button>Upload PDF</button>
        </Link>
        <Link to="/result">
          <button>View Results</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;