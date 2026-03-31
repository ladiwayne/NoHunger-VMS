import React, { useEffect, useState } from 'react';
import { volunteerService, activityService, invitationService } from '../services/api';
import { useAuth } from '../utils/authContext';
import './styles/Dashboard.css';

export const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, invitationsRes] = await Promise.all([
        activityService.getAll(),
        invitationService.getAll(),
      ]);
      setActivities(activitiesRes.data);
      setInvitations(invitationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyActivity = async (activityId) => {
    try {
      await volunteerService.applyForActivity(user.id, activityId);
      alert('Applied for activity successfully');
      fetchData();
    } catch (error) {
      console.error('Error applying for activity:', error);
      alert('Failed to apply for activity');
    }
  };

  const handleInvitationResponse = async (invitationId, action) => {
    try {
      if (action === 'accept') {
        await invitationService.accept(invitationId);
      } else {
        await invitationService.reject(invitationId);
      }
      alert(`Invitation ${action}ed successfully`);
      fetchData();
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      alert(`Failed to ${action} invitation`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Volunteer Dashboard</h1>
      <p>Welcome, {user?.firstName} {user?.lastName}</p>

      <section className="dashboard-section">
        <h2>Pending Invitations</h2>
        <div className="invitations-grid">
          {invitations.filter(i => i.status === 'pending').map(invitation => (
            <div key={invitation._id} className="invitation-card">
              <h3>{invitation.eventId?.title || invitation.activityId?.title}</h3>
              <p>{invitation.eventId?.description || invitation.activityId?.description}</p>
              <div className="invitation-actions">
                <button onClick={() => handleInvitationResponse(invitation._id, 'accept')} className="btn-accept">
                  Accept
                </button>
                <button onClick={() => handleInvitationResponse(invitation._id, 'reject')} className="btn-reject">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Available Activities</h2>
        <div className="activities-grid">
          {activities.filter(a => a.status === 'published').map(activity => (
            <div key={activity._id} className="activity-card">
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <p><strong>Location:</strong> {activity.location}</p>
              <p><strong>Volunteers Needed:</strong> {activity.volunteersNeeded}</p>
              <button onClick={() => handleApplyActivity(activity._id)} className="btn-apply">
                Apply
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
