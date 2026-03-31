import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const MOCK_STORAGE_KEY = 'nohunger-vms-mock-db';
const MOCK_MODE_KEY = 'nohunger-vms-api-mode';
const MOCK_TOKEN_PREFIX = 'mock-token:';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const createMockState = () => ({
  users: [
    {
      _id: 'admin-1',
      firstName: 'Amina',
      lastName: 'Coordinator',
      email: 'admin@nohunger.local',
      password: 'admin123',
      phone: '555-0100',
      role: 'admin',
      status: 'approved',
      totalHours: 0,
    },
    {
      _id: 'volunteer-1',
      firstName: 'Daniel',
      lastName: 'Volunteer',
      email: 'volunteer@nohunger.local',
      password: 'volunteer123',
      phone: '555-0101',
      role: 'volunteer',
      status: 'approved',
      totalHours: 18.5,
    },
    {
      _id: 'volunteer-2',
      firstName: 'Grace',
      lastName: 'Applicant',
      email: 'grace@nohunger.local',
      password: 'volunteer123',
      phone: '555-0102',
      role: 'volunteer',
      status: 'pending',
      totalHours: 4,
    },
  ],
  activities: [
    {
      _id: 'activity-1',
      title: 'Community Food Packing',
      description: 'Pack dry food kits for family distribution.',
      location: 'Main Warehouse',
      volunteersNeeded: 12,
      volunteersApplied: ['volunteer-1'],
      volunteersApproved: ['volunteer-1'],
      status: 'published',
      checkInCode: 'PACK-2048',
    },
    {
      _id: 'activity-2',
      title: 'Neighborhood Meal Delivery',
      description: 'Deliver prepared meals to elderly residents.',
      location: 'North District',
      volunteersNeeded: 8,
      volunteersApplied: [],
      volunteersApproved: [],
      status: 'published',
      checkInCode: 'MEAL-7712',
    },
  ],
  events: [
    {
      _id: 'event-1',
      title: 'Weekend Distribution Drive',
      description: 'A citywide volunteer event for food distribution.',
    },
  ],
  invitations: [
    {
      _id: 'invitation-1',
      volunteerId: 'volunteer-1',
      eventId: {
        _id: 'event-1',
        title: 'Weekend Distribution Drive',
        description: 'A citywide volunteer event for food distribution.',
      },
      status: 'pending',
    },
  ],
  tasks: [
    {
      _id: 'task-1',
      title: 'Confirm driver roster',
      status: 'pending',
      assignedTo: 'volunteer-1',
    },
  ],
});

const readMockState = () => {
  const savedState = localStorage.getItem(MOCK_STORAGE_KEY);

  if (savedState) {
    return JSON.parse(savedState);
  }

  const state = createMockState();
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  return state;
};

const writeMockState = (state) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
};

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    id: user._id,
  };
};

const getMockToken = (userId) => `${MOCK_TOKEN_PREFIX}${userId}`;

const getTokenUserId = () => {
  const token = localStorage.getItem('token') || '';
  if (!token.startsWith(MOCK_TOKEN_PREFIX)) {
    return null;
  }

  return token.slice(MOCK_TOKEN_PREFIX.length);
};

const getCurrentMockUser = () => {
  const userId = getTokenUserId();
  if (!userId) {
    return null;
  }

  const state = readMockState();
  return state.users.find((user) => user._id === userId) || null;
};

const mockResponse = (data) => Promise.resolve({ data });

const mockError = (message, status = 400) => {
  const error = new Error(message);
  error.response = {
    status,
    data: { message },
  };
  return Promise.reject(error);
};

const shouldUseMockFallback = (error) => {
  if (!error) {
    return false;
  }

  return !error.response;
};

const isMockMode = () => localStorage.getItem(MOCK_MODE_KEY) === 'mock';

const enableMockMode = () => {
  localStorage.setItem(MOCK_MODE_KEY, 'mock');
};

const withFallback = async (requestFn, mockFn) => {
  if (isMockMode()) {
    return mockFn();
  }

  try {
    return await requestFn();
  } catch (error) {
    if (!shouldUseMockFallback(error)) {
      throw error;
    }

    enableMockMode();
    return mockFn();
  }
};

const mockApi = {
  register: async (userData) => {
    const state = readMockState();
    const existingUser = state.users.find((user) => user.email.toLowerCase() === userData.email.toLowerCase());

    if (existingUser) {
      return mockError('Email is already registered', 409);
    }

    const newUser = {
      _id: `volunteer-${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phone: userData.phone || '',
      role: userData.role || 'volunteer',
      status: userData.role === 'admin' ? 'approved' : 'pending',
      totalHours: 0,
    };

    state.users.push(newUser);
    writeMockState(state);

    return mockResponse({
      token: getMockToken(newUser._id),
      user: sanitizeUser(newUser),
    });
  },
  login: async ({ email, password }) => {
    const state = readMockState();
    const user = state.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      return mockError('Invalid email or password', 401);
    }

    return mockResponse({
      token: getMockToken(user._id),
      user: sanitizeUser(user),
    });
  },
  getCurrentUser: async () => {
    const user = getCurrentMockUser();
    if (!user) {
      return mockError('Unauthorized', 401);
    }

    return mockResponse(sanitizeUser(user));
  },
  getVolunteers: async () => {
    const state = readMockState();
    return mockResponse(state.users.filter((user) => user.role === 'volunteer').map(sanitizeUser));
  },
  updateProfile: async (id, data) => {
    const state = readMockState();
    const user = state.users.find((entry) => entry._id === id);

    if (!user) {
      return mockError('Volunteer not found', 404);
    }

    Object.assign(user, data);
    writeMockState(state);
    return mockResponse(sanitizeUser(user));
  },
  applyForActivity: async (userId, activityId) => {
    const state = readMockState();
    const activity = state.activities.find((entry) => entry._id === activityId);

    if (!activity) {
      return mockError('Activity not found', 404);
    }

    if (!activity.volunteersApplied.includes(userId)) {
      activity.volunteersApplied.push(userId);
    }

    writeMockState(state);
    return mockResponse({ message: 'Applied successfully' });
  },
  getVolunteerActivities: async (userId) => {
    const state = readMockState();
    const activities = state.activities.filter((activity) => activity.volunteersApplied.includes(userId));
    return mockResponse(activities);
  },
  getActivities: async () => {
    const state = readMockState();
    return mockResponse(state.activities);
  },
  getActivityById: async (id) => {
    const state = readMockState();
    const activity = state.activities.find((entry) => entry._id === id);
    return activity ? mockResponse(activity) : mockError('Activity not found', 404);
  },
  updateActivity: async (id, data) => {
    const state = readMockState();
    const activity = state.activities.find((entry) => entry._id === id);

    if (!activity) {
      return mockError('Activity not found', 404);
    }

    Object.assign(activity, data);
    writeMockState(state);
    return mockResponse(activity);
  },
  approveActivityVolunteer: async (id, volunteerId) => {
    const state = readMockState();
    const activity = state.activities.find((entry) => entry._id === id);

    if (!activity) {
      return mockError('Activity not found', 404);
    }

    if (!activity.volunteersApproved.includes(volunteerId)) {
      activity.volunteersApproved.push(volunteerId);
    }

    writeMockState(state);
    return mockResponse(activity);
  },
  getEvents: async () => {
    const state = readMockState();
    return mockResponse(state.events);
  },
  getEventById: async (id) => {
    const state = readMockState();
    const event = state.events.find((entry) => entry._id === id);
    return event ? mockResponse(event) : mockError('Event not found', 404);
  },
  getInvitations: async () => {
    const user = getCurrentMockUser();
    const state = readMockState();

    if (!user) {
      return mockError('Unauthorized', 401);
    }

    if (user.role === 'admin') {
      return mockResponse(state.invitations);
    }

    return mockResponse(state.invitations.filter((invitation) => invitation.volunteerId === user._id));
  },
  respondToInvitation: async (id, status) => {
    const state = readMockState();
    const invitation = state.invitations.find((entry) => entry._id === id);

    if (!invitation) {
      return mockError('Invitation not found', 404);
    }

    invitation.status = status;
    writeMockState(state);
    return mockResponse(invitation);
  },
  getTasks: async () => {
    const state = readMockState();
    return mockResponse(state.tasks);
  },
  getAssignedTasks: async () => {
    const user = getCurrentMockUser();
    const state = readMockState();
    return mockResponse(state.tasks.filter((task) => task.assignedTo === user?._id));
  },
  updateTaskStatus: async (id, status) => {
    const state = readMockState();
    const task = state.tasks.find((entry) => entry._id === id);

    if (!task) {
      return mockError('Task not found', 404);
    }

    task.status = status;
    writeMockState(state);
    return mockResponse(task);
  },
  getStats: async () => {
    const state = readMockState();
    const volunteers = state.users.filter((user) => user.role === 'volunteer');
    const approvedVolunteers = volunteers.filter((user) => user.status === 'approved');
    const totalHours = volunteers.reduce((sum, user) => sum + (user.totalHours || 0), 0);

    return mockResponse({
      totalVolunteers: volunteers.length,
      approvedVolunteers: approvedVolunteers.length,
      totalActivities: state.activities.length,
      totalEvents: state.events.length,
      totalHours,
    });
  },
  updateVolunteerStatus: async (id, status) => {
    const state = readMockState();
    const user = state.users.find((entry) => entry._id === id && entry.role === 'volunteer');

    if (!user) {
      return mockError('Volunteer not found', 404);
    }

    user.status = status;
    writeMockState(state);
    return mockResponse(sanitizeUser(user));
  },
};

export const authService = {
  register: (userData) => withFallback(() => api.post('/auth/register', userData), () => mockApi.register(userData)),
  login: (credentials) => withFallback(() => api.post('/auth/login', credentials), () => mockApi.login(credentials)),
  getCurrentUser: () => withFallback(() => api.get('/auth/me'), () => mockApi.getCurrentUser()),
};

export const volunteerService = {
  getAll: () => withFallback(() => api.get('/volunteers'), () => mockApi.getVolunteers()),
  getById: (id) => withFallback(() => api.get(`/volunteers/${id}`), () => mockApi.getVolunteers().then((response) => ({ data: response.data.find((user) => user._id === id || user.id === id) }))),
  updateProfile: (id, data) => withFallback(() => api.put(`/volunteers/${id}`, data), () => mockApi.updateProfile(id, data)),
  applyForActivity: (id, activityId) => withFallback(() => api.post(`/volunteers/${id}/apply-activity`, { activityId }), () => mockApi.applyForActivity(id, activityId)),
  getActivities: (id) => withFallback(() => api.get(`/volunteers/${id}/activities`), () => mockApi.getVolunteerActivities(id)),
};

export const activityService = {
  create: (data) => withFallback(() => api.post('/activities', data), () => mockResponse(data)),
  getAll: () => withFallback(() => api.get('/activities'), () => mockApi.getActivities()),
  getById: (id) => withFallback(() => api.get(`/activities/${id}`), () => mockApi.getActivityById(id)),
  update: (id, data) => withFallback(() => api.put(`/activities/${id}`, data), () => mockApi.updateActivity(id, data)),
  approveVolunteer: (id, volunteerId) => withFallback(() => api.post(`/activities/${id}/approve-volunteer`, { volunteerId }), () => mockApi.approveActivityVolunteer(id, volunteerId)),
};

export const eventService = {
  create: (data) => withFallback(() => api.post('/events', data), () => mockResponse(data)),
  getAll: () => withFallback(() => api.get('/events'), () => mockApi.getEvents()),
  getById: (id) => withFallback(() => api.get(`/events/${id}`), () => mockApi.getEventById(id)),
  sendInvitations: (id, volunteerIds) => withFallback(() => api.post(`/events/${id}/send-invitations`, { volunteerIds }), () => mockResponse({ id, volunteerIds })),
};

export const checkinService = {
  checkin: (data) => withFallback(() => api.post('/checkins/checkin', data), () => mockResponse({ message: 'Checked in', ...data })),
  checkout: (id) => withFallback(() => api.put(`/checkins/${id}/checkout`), () => mockResponse({ id, status: 'checked-out' })),
  approveCheckIn: (id) => withFallback(() => api.put(`/checkins/${id}/approve-checkin`), () => mockResponse({ id, status: 'approved-checkin' })),
  approveCheckOut: (id) => withFallback(() => api.put(`/checkins/${id}/approve-checkout`), () => mockResponse({ id, status: 'approved-checkout' })),
  getAll: () => withFallback(() => api.get('/checkins'), () => mockResponse([])),
};

export const invitationService = {
  getAll: () => withFallback(() => api.get('/invitations'), () => mockApi.getInvitations()),
  accept: (id) => withFallback(() => api.put(`/invitations/${id}/accept`), () => mockApi.respondToInvitation(id, 'accepted')),
  reject: (id) => withFallback(() => api.put(`/invitations/${id}/reject`), () => mockApi.respondToInvitation(id, 'rejected')),
};

export const taskService = {
  create: (data) => withFallback(() => api.post('/tasks', data), () => mockResponse(data)),
  getAll: () => withFallback(() => api.get('/tasks'), () => mockApi.getTasks()),
  getAssignedToMe: () => withFallback(() => api.get('/tasks/assigned-to-me'), () => mockApi.getAssignedTasks()),
  updateStatus: (id, status) => withFallback(() => api.put(`/tasks/${id}/status`, { status }), () => mockApi.updateTaskStatus(id, status)),
};

export const adminService = {
  getStats: () => withFallback(() => api.get('/admin/dashboard/stats'), () => mockApi.getStats()),
  approveVolunteer: (id) => withFallback(() => api.put(`/admin/volunteers/${id}/approve`), () => mockApi.updateVolunteerStatus(id, 'approved')),
  rejectVolunteer: (id) => withFallback(() => api.put(`/admin/volunteers/${id}/reject`), () => mockApi.updateVolunteerStatus(id, 'rejected')),
  getVolunteerHours: (id) => withFallback(() => api.get(`/admin/volunteers/${id}/hours`), () => mockApi.getVolunteers().then((response) => ({ data: response.data.find((user) => user._id === id || user.id === id)?.totalHours || 0 }))),
};

export default api;
