const API_BASE = '/api';

interface AuthResponse {
  user: {
    id: number;
    name: string;
    loginId: string;
    email?: string;
    role: string;
    avatar?: string;
  };
  token: string;
}

export async function register(name: string, loginId: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, loginId, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  return response.json();
}

export async function login(loginId: string, password: string): Promise<AuthResponse> {
  // Add timestamp to force fresh request and bypass Safari cache
  const cacheBuster = `?_=${Date.now()}`;
  const response = await fetch(`${API_BASE}/auth/login${cacheBuster}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    cache: 'no-store',
    body: JSON.stringify({ loginId, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return response.json();
}

export async function getAllUsers(token: string) {
  const response = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get users');
  }

  return response.json();
}

export async function updateLastSeen(token: string) {
  const response = await fetch(`${API_BASE}/users/update-last-seen`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to update last seen');
  }

  return response.json();
}

export async function getConversations(token: string) {
  const response = await fetch(`${API_BASE}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get conversations');
  }

  return response.json();
}

export async function createConversation(token: string, title: string, memberIds: number[]) {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, memberIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  return response.json();
}

export async function getMessages(token: string, conversationId: number) {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get messages');
  }

  return response.json();
}

export async function uploadFile(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response.json();
}

export async function createUserAsAdmin(token: string, data: {
  name: string;
  loginId: string;
  email?: string;
  password: string;
  role?: 'admin' | 'user';
}) {
  const response = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}

export async function getAdminUsers(token: string) {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get admin users');
  }

  return response.json();
}

export async function deleteUser(token: string, userId: number) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

export async function resetUserPassword(token: string, userId: number, newPassword: string) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/password`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}
