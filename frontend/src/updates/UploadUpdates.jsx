import React, { useState } from 'react';
import axios from 'axios';
import './UploadUpdates.css';

function UploadUpdates() {
  const [update, setUpdate] = useState({
    title: '',
    description: '',
    date: ''
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setUpdate(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', update.title);
      formData.append('description', update.description);
      formData.append('date', update.date);

      const response = await axios.post('http://localhost:5000/auth/upload-updates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Assuming the server responds with a status code 201 for created
      if (response.status === 201) {
        alert('Update posted successfully! ' );
        setUpdate({ title: '', description: '', date: '' }); // Clear form
      } else {
        alert('Unexpected response: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      // If the error comes with a server response, show that message
      if (error.response && error.response.data) {
        alert('Failed to post update: ' + (error.response.data.error || error.response.data.message));
      } else {
        alert('Failed to post update: ' + error.message);
      }
    }
  }

  return (
    <div className="upload-updates-container">
      <h1>Upload Update</h1>
      <p className="message"></p>
      <form onSubmit={handleSubmit} className="upload-updates-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input 
              type="text"
              id="title"
              value={update.title}
              onChange={handleChange}
              required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea 
              id="description"
              value={update.description}
              onChange={handleChange}
              rows="5"
              required
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input 
              type="date"
              id="date"
              value={update.date}
              onChange={handleChange}
              required
          />
        </div>
        <button type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default UploadUpdates;