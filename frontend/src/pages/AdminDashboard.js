import React, { useEffect, useState } from 'react';
import { adminService, volunteerService, activityService, eventService } from '../services/api';
import './styles/Dashboard.css';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, volunteersRes, activitiesRes] = await Promise.all([
        adminService.getStats(),
        volunteerService.getAll(),
        activityService.getAll(),
      ]);
      setStats(statsRes.data);
      setVolunteers(volunteersRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVolunteer = async (id) => {
    try {
      await adminService.approveVolunteer(id);
      alert('Volunteer approved');
      fetchData();
    } catch (error) {
      console.error('Error approving volunteer:', error);
      alert('Failed to approve volunteer');
    }
  };

  const handleRejectVolunteer = async (id) => {
    try {
      await adminService.rejectVolunteer(id);
      alert('Volunteer rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting volunteer:', error);
      alert('Failed to reject volunteer');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteers')}
        >
          Volunteers
        </button>
        <button
          className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          Activities
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <section className="dashboard-section">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Volunteers</h3>
              <p className="stat-number">{stats?.totalVolunteers}</p>
            </div>
            <div className="stat-card">
              <h3>Approved Volunteers</h3>
              <p className="stat-number">{stats?.approvedVolunteers}</p>
            </div>
            <div className="stat-card">
              <h3>Total Activities</h3>
              <p className="stat-number">{stats?.totalActivities}</p>
            </div>
            <div className="stat-card">
              <h3>Total Events</h3>
              <p className="stat-number">{stats?.totalEvents}</p>
            </div>
            <div className="stat-card">
              <h3>Total Volunteer Hours</h3>
              <p className="stat-number">{stats?.totalHours.toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'volunteers' && (
        <section className="dashboard-section">
          <h2>Volunteers Management</h2>
          <div className="volunteers-list">
            {volunteers.map(volunteer => (
              <div key={volunteer._id} className="volunteer-item">
                <div className="volunteer-info">
                  <h3>{volunteer.firstName} {volunteer.lastName}</h3>
                  <p>Email: {volunteer.email}</p>
                  <p>Phone: {volunteer.phone}</p>
                  <p>Status: <span className={`status ${volunteer.status}`}>{volunteer.status}</span></p>
                </div>
                <div className="volunteer-actions">
                  {volunteer.status === 'pending' && (
                    <>
                      <button onClick={() => handleApproveVolunteer(volunteer._id)} className="btn-approve">
                        Approve
                      </button>
                      <button onClick={() => handleRejectVolunteer(volunteer._id)} className="btn-reject">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'activities' && (
        <section className="dashboard-section">
          <h2>Activities Management</h2>
          <div className="activities-list">
            {activities.map(activity => (
              <div key={activity._id} className="activity-item">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <p><strong>Location:</strong> {activity.location}</p>
                <p><strong>Check-in Code:</strong> {activity.checkInCode}</p>
                <p><strong>Volunteers Applied:</strong> {activity.volunteersApplied.length}</p>
                <p><strong>Volunteers Approved:</strong> {activity.volunteersApproved.length}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
