import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentHome.css';
import image1 from '../images/college_logo.png'; // Adjust the path as necessary

function StudentHome() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [navigate]);

    return (
        <div className="student-home">
            <header className="student-home-header">
                <h1>ADARSH EDUCATIONAL INSTITUTIONS</h1>
            </header>
            {user && <h4>Roll No: {user.roll}</h4>}
                <img src={image1} alt="College Logo" className="college-logo" />
            <main className="student-home-main">
                <div className="student-home-card" onClick={() => navigate('/result')}>
                    <h2>View Results</h2>
                    <p>Check your academic performance and results.</p>
                </div>
                <div className="student-home-card" onClick={() => navigate('/update')}>
                    <h2>Updates</h2>
                    <p>View updates for latest information.</p>
                </div>
                <div className="student-home-card" onClick={() => navigate('/courses')}>
                    <h2>Materials</h2>
                    <p>Download academic materials.</p>
                </div>
            </main>
            <div className="developer-info">
                <h2>Developed By</h2>
                <div className="developer-images">
                <img src="" alt="" />
                <img src="" alt="" />
                <img src="" alt="" />
                </div>

            </div>
            <footer className="student-home-footer">
                <p>&copy; {new Date().getFullYear()} Computer Science and Engineering (2022-2026)</p>
            </footer>
        </div>
    );
}

export default StudentHome;