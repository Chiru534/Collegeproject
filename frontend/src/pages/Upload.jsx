import React, { useState } from 'react';
import axios from 'axios';
import './Upload.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setStatus('Processing PDF...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', semester);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData);
      
      const processId = response.data.processId;
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await axios.get(
            `http://localhost:5000/progress/${processId}`
          );
          
          const { progress, status, success } = progressResponse.data;
          setProgress(progress);
          setStatus(status);
          setSuccess(success);

          if (progress === 100 || status.includes('Error')) {
            clearInterval(pollInterval);
            setLoading(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setLoading(false);
          setStatus('Error checking progress');
          setSuccess(false);
        }
      }, 1000);

    } catch (error) {
      setStatus('Upload failed: ' + (error.response?.data?.message || 'Unknown error'));
      setLoading(false);
      setSuccess(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Results PDF</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="semesterSelect">Select Semester:</label>
          <select 
            id="semesterSelect" 
            value={semester} 
            onChange={e => setSemester(e.target.value)}
          >
            <option value="">--Select Semester--</option>
            <option value="1-1">1-1</option>
            <option value="1-2">1-2</option>
            <option value="2-1">2-1</option>
            <option value="2-2">2-2</option>
            <option value="3-1">3-1</option>
            <option value="3-2">3-2</option>
            <option value="4-1">4-1</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="fileInput">Select PDF File:</label>
          <input
            type="file"
            id="fileInput"
            accept="application/pdf"
            onChange={e => setFile(e.target.files[0])}
          />
        </div>
        {loading && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            />
            <p className={`status-text ${success ? 'success' : ''}`}>
              {status}
            </p>
          </div>
        )}
        {!loading && success && (
          <div className="success-message">
            <p>PDF processed successfully! ✅</p>
          </div>
        )}
        <button type="submit" disabled={!file || !semester || loading}>
          {loading ? 'Processing...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}

export default Upload;