import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Result.css';

// Update semester options
const SEMESTER_OPTIONS = [
  '1-1', '1-2',
  '2-1', '2-2',
  '3-1', '3-2',
  '4-1', '4-2'
];

function Result() {
  const [selectedSemester, setSelectedSemester] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const navigate = useNavigate();

  // Check login status on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    // Parse user data to check admin status
    const user = JSON.parse(userData);
    setIsAdmin(user.isAdmin || false);
    if (!isAdmin) {
      setRollNumber(user.roll);
    }
  }, [navigate]);

  const handleGetResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        throw new Error('User not authenticated');
      }

      const apiUrl = isAdmin 
        ? `http://localhost:5000/auth/admin/results/${rollNumber}/${selectedSemester}`
        : `http://localhost:5000/auth/results/${userData.roll}/${selectedSemester}`;

      const response = await axios.get(apiUrl);
      
      if (response.data.success) {
        const resultData = Array.isArray(response.data.data) 
          ? response.data.data[0] 
          : response.data.data;
        
        setResult(resultData);
      } else {
        setError(response.data.error || 'No results found');
      }
    } catch (error) {
      console.error('❌ Error details:', error);
      setError(error.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="result-details">
        <h2>Result for Roll: {result.roll}</h2>
        <div>
          <h3>Semester: {selectedSemester}</h3>
          {result.subjects && result.subjects.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Internal</th>
                  <th>Grade</th>
                  <th>Credits</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td>{subject.subjectCode}</td>
                    <td>{subject.subjectName}</td>
                    <td>{subject.internal}</td>
                    <td>{subject.grade}</td>
                    <td>{subject.credits}</td>
                    <td>{subject.status}</td>
                  </tr>
                ))}
              </tbody>
              {result.sgpa && (
                <tfoot>
                  <tr>
                    <td colSpan="6">
                      <strong>SGPA: </strong>{result.sgpa.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <p>No subjects found</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="result-container">
      <h1>Student Result</h1>
      
      {/* Show roll number input only for admin users */}
      {isAdmin && (
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="roll-input"><strong>Enter Roll Number: </strong></label>
          <input
            id="roll-input"
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="Enter roll number"
          />
        </div>
      )}
      
      <div style={{ marginBottom: '16px', }}>
        <label htmlFor="semester-select"><strong >Select Semester: </strong></label>
        <select
          id="semester-select"
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setResult(null);
            setError(null);
          }}
        >
          <option value="">--Select Semester--</option>
          {SEMESTER_OPTIONS.map((sem) => (
            <option key={sem} value={sem}>{sem}</option>
          ))}
        </select>
      </div>

      {selectedSemester && (
        <button onClick={handleGetResult} disabled={loading}>
          {loading ? 'Loading...' : 'Get Result'}
        </button>
      )}

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}

      {renderResults()}
    </div>
  );
}

export default Result;