'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Parent {
  id: number;
  name: string;
  phoneNumber: string;
  preferredLanguage: string;
  checkInTime: string;
  timezone: string;
  createdAt: string;
}

interface CheckIn {
  id: number;
  scheduledDate: string;
  messageSentAt: string | null;
  responseReceivedAt: string | null;
  responseText: string | null;
  responseType: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [showAddParent, setShowAddParent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const storedToken = getCookie('token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    fetchParents(storedToken);
  }, [router]);

  const fetchParents = async (authToken: string) => {
    try {
      const response = await fetch('/api/parents', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParents(data.parents);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckIns = async (parentId: number) => {
    try {
      const response = await fetch(`/api/parents/${parentId}/check-ins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  };

  const handleParentSelect = (parent: Parent) => {
    setSelectedParent(parent);
    fetchCheckIns(parent.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Daily Check-In</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <button
            onClick={() => setShowAddParent(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            + Add Parent
          </button>
        </div>

        {parents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No parents registered</h3>
            <p className="text-gray-600 mb-4">Add your first parent to start daily check-ins</p>
            <button
              onClick={() => setShowAddParent(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Add Parent
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Your Parents</h3>
              <div className="space-y-3">
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    onClick={() => handleParentSelect(parent)}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      selectedParent?.id === parent.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{parent.name}</div>
                    <div className="text-sm text-gray-600">
                      Check-in: {parent.checkInTime} ({parent.timezone})
                    </div>
                    <div className="text-sm text-gray-600">
                      Language: {parent.preferredLanguage}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedParent && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Check-in History: {selectedParent.name}
                </h3>
                {checkIns.length === 0 ? (
                  <p className="text-gray-600">No check-ins recorded yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {checkIns.map((checkIn) => (
                      <div key={checkIn.id} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">
                            {new Date(checkIn.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            checkIn.responseReceivedAt
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {checkIn.responseReceivedAt ? 'Responded' : 'No response'}
                          </div>
                        </div>
                        {checkIn.messageSentAt && (
                          <div className="text-sm text-gray-600">
                            Sent: {new Date(checkIn.messageSentAt).toLocaleString()}
                          </div>
                        )}
                        {checkIn.responseReceivedAt && (
                          <div className="text-sm text-gray-600">
                            Responded: {new Date(checkIn.responseReceivedAt).toLocaleString()}
                          </div>
                        )}
                        {checkIn.responseText && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">Response:</span> {checkIn.responseText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showAddParent && (
          <AddParentModal
            onClose={() => setShowAddParent(false)}
            onAdd={() => {
              setShowAddParent(false);
              fetchParents(token);
            }}
            token={token}
          />
        )}
      </main>
    </div>
  );
}

function AddParentModal({ onClose, onAdd, token }: { onClose: () => void; onAdd: () => void; token: string }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    preferredLanguage: 'en',
    checkInTime: '',
    timezone: 'Asia/Kolkata',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onAdd();
      } else {
        setError(data.error || 'Failed to add parent');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Add Parent</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="mr">Marathi (मराठी)</option>
              <option value="gu">Gujarati (ગુજરાતી)</option>
              <option value="bn">Bengali (বাংলা)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
            <input
              type="time"
              required
              value={formData.checkInTime}
              onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time</option>
              <option value="America/New_York">Eastern Time (US)</option>
              <option value="America/Los_Angeles">Pacific Time (US)</option>
              <option value="Europe/London">GMT</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'Adding...' : 'Add Parent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
