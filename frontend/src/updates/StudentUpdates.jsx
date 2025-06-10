import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentUpdates.css';

function StudentUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/updates');
        if (response.data.success) {
          setUpdates(response.data.data);
        } else {
          setError('Failed to fetch updates');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  if (loading) {
    return <div>Loading updates...</div>;
  }

  if (error) {
    return <div>Error fetching updates: {error}</div>;
  }

  return (
    <div className="student-updates-container">
      <h1>Latest Updates</h1>
      {updates.length === 0 ? (
        <p>No updates available.</p>
      ) : (
        <div className="updates-grid">
          {updates.map((update) => (
            <div className="update-card" key={update._id}>
              <h3 className="update-title">{update.title}</h3>
              <p className="update-description">{update.description}</p>
              <small className="update-date">
                {new Date(update.date).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentUpdates;