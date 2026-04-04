import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, MessageSquare, Award, BarChart3, PieChart, Download, Upload, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:8080/api';

// Utility function for API calls
const api = {
  get: (url) => fetch(`${API_BASE}${url}`).then(r => r.json()),
  post: (url, data) => fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  put: (url, data) => fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  delete: (url) => fetch(`${API_BASE}${url}`, { method: 'DELETE' })
};

// Main App Component with Login
export default function AttendanceSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('TEACHER');
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user, role) => {
    setCurrentUser(user);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole(null);
  };

  if (!isLoggedIn) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  return <MainApp currentUser={currentUser} userRole={userRole} onLogout={handleLogout} />;
}

  // Student: My Attendance Calendar Component - Real API
  function MyAttendanceCalendar({ currentUser }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
      const fetchAttendance = async () => {
        try {
          setLoading(true);
          setError('');
          setDebugInfo('');
          
          // Get current user's student record
          const students = await api.get('/students');
          console.log('All students:', students);
          
          const currentStudent = students.find(s => s.userId === currentUser.id);
          console.log('Current user ID:', currentUser.id);
          console.log('Current student:', currentStudent);
          
          if (!currentStudent) {
            setError('Student record not found. Please contact admin.');
            setDebugInfo(`Searched ${students.length} students but found no match for userId: ${currentUser.id}`);
            setLoading(false);
            return;
          }
          
          console.log(`Fetching attendance for student ID: ${currentStudent.id}`);
          const attendance = await api.get(`/attendance/student/${currentStudent.id}`);
          console.log('Attendance records:', attendance);
          
          if (!attendance || attendance.length === 0) {
            setDebugInfo(`No attendance records found for student ID ${currentStudent.id}`);
            setAttendanceData({});
          } else {
            const data = {};
            attendance.forEach(a => {
              data[a.attendanceDate] = a.status;
            });
            setAttendanceData(data);
            setDebugInfo(`Loaded ${attendance.length} attendance records`);
          }
        } catch (err) {
          console.error('Failed to fetch attendance:', err);
          setError(`Error loading attendance: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      fetchAttendance();
    }, [currentUser.id]);

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedMonth);
    const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  
    const getStatusColor = (date) => {
      const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const status = attendanceData[dateStr];
      if (status === 'PRESENT') return 'bg-green-500';
      if (status === 'ABSENT') return 'bg-red-500';
      if (status === 'LATE') return 'bg-yellow-500';
      return 'bg-gray-200';
    };

    const monthStats = Object.values(attendanceData).reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    if (loading) return <div className="text-center py-8">Loading attendance...</div>;

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}
        
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">ℹ️ {debugInfo}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Attendance Calendar</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                ←
              </button>
              <span className="font-medium">
                {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${
                  day ? getStatusColor(day) : 'bg-gray-100'
                } ${day ? 'text-white cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-6 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-sm">Present: {monthStats.PRESENT || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span className="text-sm">Absent: {monthStats.ABSENT || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-sm">Late: {monthStats.LATE || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student: Chat with Teacher Component - Enhanced UI/UX
  function ChatWithTeacher({ currentUser }) {
    const [teachers, setTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [useAI, setUseAI] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    // Fetch teachers from backend on component mount
    useEffect(() => {
      const fetchTeachers = async () => {
        try {
          setLoadingTeachers(true);
          const response = await fetch('http://localhost:8080/api/admin/teachers/list/all');
          if (response.ok) {
            const data = await response.json();
            const fetchedTeachers = data.map(teacher => ({
              id: teacher.userId || teacher.id,
              name: teacher.name,
              subject: teacher.subject || 'General',
              email: teacher.email,
              phone: teacher.phone
            }));
            setTeachers(fetchedTeachers.length > 0 ? fetchedTeachers : []);
          } else {
            setTeachers([]);
          }
        } catch (error) {
          console.error('Error fetching teachers:', error);
          setTeachers([]);
        } finally {
          setLoadingTeachers(false);
        }
      };

      // Check if AI service is configured
      const checkAIStatus = async () => {
        try {
          const response = await fetch('http://localhost:8080/api/ai/status');
          if (response.ok) {
            const data = await response.json();
            setAiEnabled(data.configured);
          }
        } catch (error) {
          console.error('Error checking AI status:', error);
          setAiEnabled(false);
        }
      };

      fetchTeachers();
      checkAIStatus();
    }, []);

    // When a teacher is selected, load the conversation between current student and that teacher
    useEffect(() => {
      const fetchConversation = async () => {
        if (!selectedTeacher || !currentUser) return;
        try {
          const conv = await api.get(`/messages/conversation/${currentUser.id}/${selectedTeacher.id}`);
          const mapped = Array.isArray(conv) ? conv.map(m => ({
            id: m.id,
            sender: m.senderId === currentUser.id ? 'student' : 'teacher',
            text: m.content,
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            isAI: false,
            isError: false,
            isRead: m.isRead
          })) : [];
          setMessages(mapped);
        } catch (err) {
          console.error('Error fetching conversation:', err);
          setMessages([]);
        }
      };

      fetchConversation();
    }, [selectedTeacher, currentUser]);

    const handleSendMessage = async () => {
      if (!newMessage.trim()) return;
      if (!selectedTeacher) return;

      const messageText = newMessage.trim();
      setNewMessage('');
      setSendingMessage(true);
      setAiLoading(useAI);

      try {
        // Build payload expected by backend (Message entity with sender and receiver user ids)
        const payload = {
          sender: { id: currentUser.id },
          receiver: { id: selectedTeacher.id },
          content: messageText,
          referenceAttendanceId: null
        };

        // Save message on server
        const saved = await api.post('/messages', payload);

        // Map saved MessageDTO to UI message and append
        const savedMsg = {
          id: saved.id,
          sender: saved.senderId === currentUser.id ? 'student' : 'teacher',
          text: saved.content,
          timestamp: saved.createdAt ? new Date(saved.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          isAI: false,
          isRead: saved.isRead
        };

        setMessages(prev => [...prev, savedMsg]);

        // If AI is enabled and user asked for AI help, call AI endpoint to show a suggested reply (not persisted)
        if (aiEnabled && useAI) {
          try {
            const response = await fetch('http://localhost:8080/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser.id,
                message: messageText,
                studentName: currentUser.name,
                teacherName: selectedTeacher.name
              })
            });

            if (response.ok) {
              const data = await response.json();
              const aiMsg = {
                id: `ai-${Date.now()}`,
                sender: 'teacher',
                text: data.response,
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isAI: true
              };
              setMessages(prev => [...prev, aiMsg]);
            }
          } catch (aiErr) {
            console.error('AI call failed:', aiErr);
          }
        }

      } catch (error) {
        console.error('Error sending message to server:', error);
        const errorMsg = {
          id: `err-${Date.now()}`,
          sender: 'teacher',
          text: '❌ Error connecting to the server. Please check your connection.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setSendingMessage(false);
        setAiLoading(false);
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[700px]">
        {/* Teacher List - Improved */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-indigo-100">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">👨‍🏫 Teachers</h3>
              <p className="text-xs text-indigo-100">({teachers.length} available)</p>
            </div>
          </div>

          {loadingTeachers ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-sm">Loading teachers...</p>
              </div>
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center text-gray-500">
                <div className="text-3xl mb-2">😔</div>
                <p className="text-sm">No teachers available yet</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => { setSelectedTeacher(teacher); setMessages([]); }}
                  className={`w-full text-left p-4 border-b transition-all hover:shadow-md ${
                    selectedTeacher?.id === teacher.id 
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-600' 
                      : 'hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👤</span>
                    <p className="font-semibold text-gray-800 flex-1 truncate">{teacher.name}</p>
                  </div>
                  <p className="text-xs text-gray-600 ml-6 truncate">📚 {teacher.subject}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window - Enhanced */}
        <div className="md:col-span-4 bg-white rounded-xl shadow-lg flex flex-col border border-indigo-100 overflow-hidden">
          {selectedTeacher ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">👨‍🏫</div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedTeacher.name}</h3>
                    <p className="text-xs text-indigo-100">📚 {selectedTeacher.subject}</p>
                  </div>
                </div>
                {aiEnabled && (
                  <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    <span>🤖</span>
                    <span className="text-xs font-medium">AI Ready</span>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Start a conversation by sending a message</p>
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm transition-all ${
                          msg.sender === 'student'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : msg.isError 
                              ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-none'
                              : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                        <div className={`text-xs mt-2 flex items-center justify-between gap-2 ${
                          msg.sender === 'student' ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          <span>{msg.timestamp}</span>
                          {msg.isAI && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">AI</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                      <div className="flex gap-2">
                        <span className="animate-bounce">•</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-indigo-100 p-4 bg-gray-50">
                {/* AI Toggle - Enhanced */}
                {aiEnabled && (
                  <div className="mb-4 flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <input
                      type="checkbox"
                      id="aiToggle"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="aiToggle" className="text-sm text-gray-700 cursor-pointer flex-1">
                      <span className="font-medium">🤖 Use AI-Powered Suggestions</span>
                      <p className="text-xs text-gray-600 mt-1">Get intelligent responses about your attendance</p>
                    </label>
                  </div>
                )}
                
                {/* Message Input - Enhanced */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                    placeholder="Type your message..."
                    disabled={sendingMessage || !selectedTeacher}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !selectedTeacher || !newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-full hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:from-indigo-700 hover:to-indigo-800"
                  >
                    {sendingMessage ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a teacher to start chatting</p>
                <p className="text-sm text-gray-400 mt-2">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Student: AI Scorecard Component
  function StudentAIScorecard({ currentUser }) {
    const [scoreData, setScoreData] = useState({
      overallScore: 0,
      performanceLevel: 'Loading...',
      attendanceScore: 0,
      punctualityScore: 0,
      engagementScore: 0,
      trend: 'calculating'
    });
    const [trendData, setTrendData] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchScoreData = async () => {
        try {
          setLoading(true);
          setError(null);

          // Get all students
          const students = await api.get('/students');
          console.log('All students:', students);

          // Find current student by userId
          const currentStudent = students.find(s => s.userId === currentUser.id);
          console.log('Current student:', currentStudent);

          if (!currentStudent) {
            setError('Student record not found');
            setLoading(false);
            return;
          }

          // Get attendance for this student
          const attendance = await api.get(`/attendance/student/${currentStudent.id}`);
          console.log('Attendance records:', attendance);

          // Calculate real statistics
          let presentDays = 0;
          let absentDays = 0;
          let lateDays = 0;

          if (attendance && Array.isArray(attendance)) {
            attendance.forEach(record => {
              if (record.status === 'PRESENT') presentDays++;
              else if (record.status === 'ABSENT') absentDays++;
              else if (record.status === 'LATE') lateDays++;
            });
          }

          const totalDays = presentDays + absentDays + lateDays;
          
          // Calculate Attendance Score (0-100)
          // Based on percentage of present days
          let attendanceScore = 0;
          if (totalDays > 0) {
            const attendancePercentage = (presentDays / totalDays) * 100;
            attendanceScore = Math.round(attendancePercentage);
          }

          // Calculate Punctuality Score (0-100)
          // Based on ratio of late arrivals to total days
          let punctualityScore = 0;
          if (totalDays > 0) {
            const latePercentage = (lateDays / totalDays) * 100;
            punctualityScore = Math.round(100 - latePercentage);
          }

          // Calculate Engagement Score (0-100)
          // Based on attendance consistency
          // Students with regular attendance get higher scores
          let engagementScore = 0;
          if (totalDays > 0) {
            if (attendanceScore >= 90) engagementScore = 95;
            else if (attendanceScore >= 80) engagementScore = 85;
            else if (attendanceScore >= 70) engagementScore = 75;
            else if (attendanceScore >= 60) engagementScore = 60;
            else engagementScore = 40;
          }

          // Calculate Overall Score (average of all three)
          const overallScore = Math.round(
            (attendanceScore + punctualityScore + engagementScore) / 3
          );

          // Determine performance level
          let performanceLevel = 'Excellent';
          if (overallScore >= 90) performanceLevel = 'Excellent';
          else if (overallScore >= 75) performanceLevel = 'Very Good';
          else if (overallScore >= 60) performanceLevel = 'Good';
          else if (overallScore >= 50) performanceLevel = 'Fair';
          else performanceLevel = 'Needs Improvement';

          // Determine trend (we'll compare current to average of all records)
          const trend = attendanceScore >= 80 ? 'improving' : 'declining';

          // Generate trend data (mock weekly breakdown for now)
          const mockTrendData = [
            { week: 'Week 1', score: Math.max(0, overallScore - 8) },
            { week: 'Week 2', score: Math.max(0, overallScore - 5) },
            { week: 'Week 3', score: Math.max(0, overallScore - 2) },
            { week: 'Week 4', score: overallScore }
          ];
          setTrendData(mockTrendData);

          // Generate AI recommendations based on scores
          const recs = [];

          if (attendanceScore >= 90) {
            recs.push('Maintain your excellent attendance - you\'re setting a great example!');
          } else if (attendanceScore >= 75) {
            recs.push('Your attendance is good. Try to reach 90%+ for better performance.');
          } else if (attendanceScore >= 60) {
            recs.push('⚠️ Your attendance needs improvement. Aim for 75% or higher to boost your score.');
          } else {
            recs.push('🚨 Critical: Your attendance is below 60%. Please prioritize attending classes.');
          }

          if (punctualityScore >= 90) {
            recs.push('Excellent punctuality! You\'re always on time for classes.');
          } else if (punctualityScore < 80) {
            recs.push('Focus on improving your punctuality. Arriving on time shows commitment.');
          }

          if (engagementScore >= 85) {
            recs.push('Your engagement level is excellent - keep participating actively!');
          } else if (engagementScore < 70) {
            recs.push('Consider being more engaged in class activities and discussions.');
          }

          recs.push('Consistent attendance leads to better academic performance. Keep it up!');

          setRecommendations(recs);

          // Update score data
          setScoreData({
            overallScore: overallScore,
            performanceLevel: performanceLevel,
            attendanceScore: attendanceScore,
            punctualityScore: punctualityScore,
            engagementScore: engagementScore,
            trend: trend
          });

          console.log('Score data calculated:', {
            overallScore: overallScore,
            attendanceScore: attendanceScore,
            punctualityScore: punctualityScore,
            engagementScore: engagementScore,
            performanceLevel: performanceLevel,
            totalDays: totalDays,
            presentDays: presentDays,
            lateDays: lateDays,
            absentDays: absentDays
          });

        } catch (err) {
          console.error('Error fetching score data:', err);
          setError(`Failed to load scorecard: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      if (currentUser && currentUser.id) {
        fetchScoreData();
      }
    }, [currentUser]);

    const getPerformanceColor = (score) => {
      if (score >= 90) return 'from-green-400 to-green-600';
      if (score >= 75) return 'from-blue-400 to-blue-600';
      if (score >= 60) return 'from-yellow-400 to-yellow-600';
      return 'from-red-400 to-red-600';
    };

    const getPerformanceLabel = (score) => {
      if (score >= 90) return 'Excellent';
      if (score >= 75) return 'Very Good';
      if (score >= 60) return 'Good';
      return 'Needs Improvement';
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculating your AI Performance Score...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Score Card */}
        <div className={`bg-gradient-to-br ${getPerformanceColor(scoreData.overallScore)} text-white rounded-lg shadow-lg p-8`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold opacity-90">Your AI Performance Score</p>
              <p className="text-5xl font-bold mt-2">{scoreData.overallScore}</p>
              <p className="text-sm opacity-90 mt-2">{getPerformanceLabel(scoreData.overallScore)}</p>
            </div>
            <div className="text-6xl opacity-20">📊</div>
          </div>
          <div className="mt-4 flex items-center space-x-2 text-sm">
            <span>{scoreData.trend === 'improving' ? '📈' : '📉'}</span>
            <span className="capitalize">{scoreData.trend} trend</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-2">Attendance Score</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-blue-600">{scoreData.attendanceScore}</p>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on your presence in classes</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium mb-2">Punctuality Score</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-purple-600">{scoreData.punctualityScore}</p>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                ⏰
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on your on-time arrivals</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium mb-2">Engagement Score</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-orange-600">{scoreData.engagementScore}</p>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                🎯
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Based on your class participation</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <span className="text-xl">💡</span>
                <p className="text-gray-700 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

// Main App Component
function MainApp({ currentUser, userRole, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const teacherTabs = ['dashboard', 'manage-students', 'mark-attendance', 'performance', 'low-attendance', 'messages'];
  const studentTabs = ['dashboard', 'my-attendance', 'chat-teacher', 'ai-scorecard', 'my-reports'];
  const adminTabs = ['dashboard', 'teachers', 'students', 'attendance', 'reports', 'users', 'create-student', 'create-teacher'];
  const tabs = userRole === 'TEACHER' ? teacherTabs : userRole === 'ADMIN' ? adminTabs : studentTabs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Smart Classroom</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
              {userRole}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {userRole === 'TEACHER' ? (
          <>
            {activeTab === 'dashboard' && <TeacherDashboard />}
            {activeTab === 'manage-students' && <ManageStudents />}
            {activeTab === 'mark-attendance' && <TeacherMarkAttendance />}
            {activeTab === 'performance' && <AIPerformanceAnalysis />}
            {activeTab === 'low-attendance' && <LowAttendanceAlert />}
            {activeTab === 'messages' && <MessageNotifications />}
          </>
        ) : userRole === 'ADMIN' ? (
          <>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'teachers' && <AdminTeachers />}
            {activeTab === 'students' && <AdminStudents />}
            {activeTab === 'attendance' && <AdminAttendance />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'create-student' && <AdminCreateStudent />}
            {activeTab === 'create-teacher' && <AdminCreateTeacher />}
          </>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
            {activeTab === 'my-attendance' && <MyAttendanceCalendar currentUser={currentUser} />}
            {activeTab === 'chat-teacher' && <ChatWithTeacher currentUser={currentUser} />}
            {activeTab === 'ai-scorecard' && <StudentAIScorecard currentUser={currentUser} />}
            {activeTab === 'my-reports' && <MyReportsView currentUser={currentUser} />}
          </>
        )}
      </main>

      {/* Floating Chatbot */}
      <ChatWidget currentUser={currentUser} />
    </div>
  );
}

// ============ LOGIN PORTAL COMPONENT ============

function LoginPortal({ onLogin }) {
  const [loginType, setLoginType] = useState('teacher'); // 'teacher', 'student', or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call real backend API
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      if (data.success && data.id) {
        // Login successful
        onLogin(
          { id: data.id, email: data.email, name: data.name },
          data.role
        );
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Server error. Please check if backend is running on localhost:8080');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginType = () => {
    setLoginType(loginType === 'teacher' ? 'student' : 'teacher');
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Users className="w-12 h-12 text-white" />
            <h1 className="text-4xl font-bold text-white">Smart Classroom</h1>
          </div>
          <p className="text-blue-100 text-lg">Attendance Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Role Selector */}
          <div className="flex bg-gray-100 border-b">
            <button
              onClick={() => !loading && setLoginType('teacher')}
              className={`flex-1 py-4 font-semibold transition-colors text-sm ${
                loginType === 'teacher'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👨‍🏫 Teacher
            </button>
            <button
              onClick={() => !loading && setLoginType('student')}
              className={`flex-1 py-4 font-semibold transition-colors text-sm ${
                loginType === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👨‍🎓 Student
            </button>
            <button
              onClick={() => !loading && setLoginType('admin')}
              className={`flex-1 py-4 font-semibold transition-colors text-sm ${
                loginType === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👨‍💼 Admin
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginType === 'teacher' ? 'teacher@school.com' : 'alice@school.com'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">Test Credentials:</p>
              <p className="text-xs text-blue-800">
                {loginType === 'teacher' 
                  ? '👨‍🏫 teacher@example.com / teacher123'
                  : loginType === 'student'
                  ? '👨‍🎓 student@example.com / student123'
                  : '👨‍💼 admin@example.com / admin123'}
              </p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Demo Login Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (loginType === 'teacher') {
                    setEmail('teacher@example.com');
                    setPassword('teacher123');
                  } else if (loginType === 'student') {
                    setEmail('student@example.com');
                    setPassword('student123');
                  } else {
                    setEmail('admin@example.com');
                    setPassword('admin123');
                  }
                }}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Fill Test Credentials
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t text-center text-xs text-gray-600">
            <p>This is a demo system for testing attendance management features.</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-blue-100">
          <p className="text-sm">
            Secure • No real credentials needed for demo • Test both roles
          </p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component - Student Personal Dashboard
function Dashboard({ currentUser }) {
  const [studentData, setStudentData] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [messages, setMessages] = useState([]);
  const [lowAttendanceAlerts, setLowAttendanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        // Fetch student info
        const students = await api.get('/students');
        const currentStudent = students.find(s => s.userId === currentUser.id);
        
        if (currentStudent) {
          // Fetch attendance records for the student
          const allAttendance = await api.get('/attendance');
          const studentAttendance = allAttendance.filter(a => a.studentId === currentStudent.id);
          
          // Calculate attendance statistics
          const totalDays = studentAttendance.length;
          const presentDays = studentAttendance.filter(a => a.status === 'PRESENT').length;
          const absentDays = studentAttendance.filter(a => a.status === 'ABSENT').length;
          const lateDays = studentAttendance.filter(a => a.status === 'LATE').length;
          const percentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : 0;
          
          setStudentData({
            name: currentUser.name,
            rollNo: currentStudent.rollNo,
            className: currentStudent.className,
            section: currentStudent.section,
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            percentage,
            studentId: currentStudent.id
          });
          
          // Get last 5 attendance records for the week
          const recentAttendance = studentAttendance.slice(-5).map((a, idx) => ({
            date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][idx] || new Date(a.attendanceDate).toLocaleDateString(),
            status: a.status,
            time: '9:00 AM'
          }));
          setWeeklyAttendance(recentAttendance);

          // Fetch messages for this student (backend provides received messages endpoint)
          try {
            const received = await api.get(`/messages/received/${currentUser.id}`);
            const studentMessages = Array.isArray(received) ? received : [];
            // Map backend MessageDTO -> UI shape and show last 5
            const mapped = studentMessages.map(m => ({
              id: m.id,
              teacherName: m.senderName || 'Teacher',
              content: m.content,
              date: m.createdAt
            }));
            setMessages(mapped.slice(-5));
            console.log('Student messages (received):', mapped);
          } catch (msgErr) {
            console.log('Messages API not available or no messages:', msgErr);
            setMessages([]);
          }

          // Check for low attendance and create alerts
          if (percentage < 75) {
            setLowAttendanceAlerts([
              {
                id: 1,
                type: 'low_attendance',
                severity: 'high',
                message: `Your attendance is critically low at ${percentage}%. You need to attend more classes to meet the minimum 75% requirement.`,
                date: new Date().toLocaleDateString(),
                fromTeacher: 'System Alert'
              }
            ]);
          } else if (percentage < 85) {
            setLowAttendanceAlerts([
              {
                id: 1,
                type: 'low_attendance',
                severity: 'medium',
                message: `Your attendance is ${percentage}%. Try to improve it to maintain good academic standing.`,
                date: new Date().toLocaleDateString(),
                fromTeacher: 'System Alert'
              }
            ]);
          } else {
            setLowAttendanceAlerts([]);
          }

        } else {
          setError('Student record not found');
        }
      } catch (err) {
        setError('Failed to fetch student data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8">Loading student dashboard...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      
      {studentData && (
        <>
        {/* Personal Info Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{studentData.name}</h2>
              <p className="text-indigo-100">Roll No: {studentData.rollNo}</p>
              <p className="text-indigo-100">Class: {studentData.className}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">{studentData.percentage}%</p>
              <p className="text-indigo-100 text-sm">Attendance</p>
            </div>
          </div>
        </div>

        {/* Low Attendance Alerts from Teachers */}
        {lowAttendanceAlerts.length > 0 && (
          <div className="space-y-3">
            {lowAttendanceAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg p-4 border-l-4 ${
                  alert.severity === 'high' 
                    ? 'bg-red-50 border-red-500' 
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {alert.severity === 'high' ? '🚨' : '⚠️'}
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        alert.severity === 'high' 
                          ? 'text-red-800' 
                          : 'text-yellow-800'
                      }`}>
                        {alert.severity === 'high' ? 'Critical' : 'Warning'}: Low Attendance
                      </p>
                      <p className={`text-sm mt-1 ${
                        alert.severity === 'high' 
                          ? 'text-red-700' 
                          : 'text-yellow-700'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs mt-2 ${
                        alert.severity === 'high' 
                          ? 'text-red-600' 
                          : 'text-yellow-600'
                      }`}>
                        From: {alert.fromTeacher} • {alert.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages from Teachers */}
        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📬 Messages from Teachers</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-3 border rounded-lg hover:bg-blue-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800">
                      {msg.teacherName || msg.fromTeacher || 'Teacher'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.date || msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {(msg.message || msg.content || '')
                      .substring(0, 150)}
                    {(msg.message || msg.content || '').length > 150 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Present Days</p>
            <p className="text-3xl font-bold text-green-600">{studentData.presentDays}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Absent Days</p>
            <p className="text-3xl font-bold text-red-600">{studentData.absentDays}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Late Days</p>
            <p className="text-3xl font-bold text-yellow-600">{studentData.lateDays}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Days</p>
            <p className="text-3xl font-bold text-blue-600">{studentData.totalDays}</p>
          </div>
        </div>

      {/* Attendance Status Alert */}
      {studentData.percentage < 75 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Low Attendance Warning!</strong> Your attendance is {studentData.percentage}%, which is below the required 75%. Please attend classes regularly or chat with your teacher to discuss any issues.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* This Week's Attendance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">This Week's Attendance</h3>
        <div className="space-y-2">
          {weeklyAttendance.map((day, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-gray-800 w-12">{day.date}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(day.status)}`}>
                  {day.status}
                </span>
              </div>
              <span className="text-sm text-gray-600">{day.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
        <ResponsiveContainer width="100%" height={250}>
          <RePieChart>
            <Pie
              data={[
                { name: 'Present', value: studentData.presentDays, color: '#10B981' },
                { name: 'Absent', value: studentData.absentDays, color: '#EF4444' },
                { name: 'Late', value: studentData.lateDays, color: '#F59E0B' }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#10B981" />
              <Cell fill="#EF4444" />
              <Cell fill="#F59E0B" />
            </Pie>
            <Tooltip />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Attendance Calendar Component
function AttendanceCalendar({ studentId }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-400';
      case 'ABSENT': return 'bg-red-400';
      case 'LATE': return 'bg-yellow-400';
      default: return 'bg-gray-200';
    }
  };

  const days = getDaysInMonth(selectedMonth);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Attendance Calendar</h3>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Previous
          </button>
          <span className="font-medium">
            {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => (
          <div
            key={day}
            className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${
              attendanceData[day] ? getStatusColor(attendanceData[day]) : 'bg-gray-100'
            } hover:opacity-80 cursor-pointer transition-opacity`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-6 mt-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span className="text-sm">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span className="text-sm">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span className="text-sm">Late</span>
        </div>
      </div>
    </div>
  );
}

// Attendance Marker Component
function AttendanceMarker({ currentUser }) {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    // Mock data - replace with actual API call
    setStudents([
      { id: 1, rollNo: 'CS001', name: 'Alice Johnson', className: '10A' },
      { id: 2, rollNo: 'CS002', name: 'Bob Smith', className: '10A' },
      { id: 3, rollNo: 'CS003', name: 'Charlie Brown', className: '10A' },
    ]);
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleSubmit = () => {
    const attendanceList = Object.entries(attendance).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status,
      remarks: ''
    }));

    // API call to save attendance
    console.log('Saving attendance:', { date: selectedDate, attendanceList });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.rollNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.className}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attendance[student.id] === status
                            ? status === 'PRESENT' ? 'bg-green-600 text-white'
                            : status === 'ABSENT' ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
}

// Student Manager Component
function StudentManager() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rollNo: '', name: '', className: '', section: '', email: '', phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call to create student
    console.log('Creating student:', formData);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Roll No"
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Class"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Save Student
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">CS001</td>
              <td className="px-6 py-4 text-sm text-gray-900">Alice Johnson</td>
              <td className="px-6 py-4 text-sm text-gray-500">10A</td>
              <td className="px-6 py-4 text-sm text-gray-500">alice@school.com</td>
              <td className="px-6 py-4 text-center">
                <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reports View Component
function MyReportsView({ currentUser }) {
  const [reportData, setReportData] = useState({
    studentName: currentUser.name,
    rollNo: '',
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all students
        const students = await api.get('/students');
        console.log('All students:', students);

        // Find current student by userId
        const currentStudent = students.find(s => s.userId === currentUser.id);
        console.log('Current student:', currentStudent);

        if (!currentStudent) {
          setError('Student record not found');
          setLoading(false);
          return;
        }

        // Get attendance for this student
        const attendance = await api.get(`/attendance/student/${currentStudent.id}`);
        console.log('Attendance records:', attendance);

        // Calculate attendance statistics
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;

        if (attendance && Array.isArray(attendance)) {
          attendance.forEach(record => {
            if (record.status === 'PRESENT') presentDays++;
            else if (record.status === 'ABSENT') absentDays++;
            else if (record.status === 'LATE') lateDays++;
          });
        }

        const totalDays = presentDays + absentDays + lateDays;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

        setReportData({
          studentName: currentStudent.name || currentUser.name,
          rollNo: currentStudent.rollNo || 'N/A',
          totalDays: totalDays,
          presentDays: presentDays,
          absentDays: absentDays,
          lateDays: lateDays,
          percentage: percentage
        });

        console.log('Report data set:', {
          studentName: currentStudent.name,
          rollNo: currentStudent.rollNo,
          totalDays: totalDays,
          presentDays: presentDays,
          absentDays: absentDays,
          lateDays: lateDays,
          percentage: percentage
        });

      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(`Failed to load report: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.id) {
      fetchReportData();
    }
  }, [currentUser]);

  const pieData = [
    { name: 'Present', value: reportData.presentDays, color: '#10B981' },
    { name: 'Absent', value: reportData.absentDays, color: '#EF4444' },
    { name: 'Late', value: reportData.lateDays, color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Attendance Report</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Student Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{reportData.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Roll No:</span>
                <span className="font-medium">{reportData.rollNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Days:</span>
                <span className="font-medium">{reportData.totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Present:</span>
                <span className="font-medium text-green-600">{reportData.presentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Absent:</span>
                <span className="font-medium text-red-600">{reportData.absentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Late:</span>
                <span className="font-medium text-yellow-600">{reportData.lateDays}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-600 font-semibold">Attendance %:</span>
                <span className="font-bold text-lg text-indigo-600">{reportData.percentage}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {reportData.percentage < 75 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Low Attendance Alert!</strong> Your attendance is below the required 75%. Please attend classes regularly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Leaderboard Component
function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // Fetch all students
        const students = await api.get('/students');
        
        // Sort by attendance percentage (descending) and add rank
        const ranked = students
          .sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0))
          .map((student, idx) => ({
            rank: idx + 1,
            name: student.name || `Student ${student.id}`,
            rollNo: student.rollNo,
            className: student.className,
            percentage: (student.attendancePercentage || 0).toFixed(1)
          }));
        
        setLeaderboard(ranked);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) return <div className="text-center py-8">Loading leaderboard...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Award className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-800">Attendance Leaderboard</h2>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No students data available</p>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((student) => (
            <div
              key={student.rank}
              className={`flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md ${
                student.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                  {getMedalEmoji(student.rank) || student.rank}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.rollNo} • {student.className}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{student.percentage}%</p>
                <p className="text-xs text-gray-500">Attendance</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Chat Widget Component
function ChatWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! 🤖 I\'m your AI Assistant powered by OpenAI. I can help you with attendance questions, academics, and more. Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      // Call backend AI endpoint
      const response = await api.post('/ai/chat', {
        userId: currentUser?.id || 0,
        message: userMessage,
        studentName: currentUser?.name || 'Student',
        teacherName: 'Your Teacher'
      });

      if (response.success && response.response) {
        setMessages(prev => [...prev, { type: 'bot', text: response.response }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: '⚠️ Could not get a response. Please check if the AI service is configured (OPENAI_API_KEY environment variable).',
          isError: true 
        }]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: `❌ Error: ${error.message}. Make sure the backend is running and OPENAI_API_KEY is set.`,
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center transition-transform hover:scale-110"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 rounded p-1">
              ✕
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-indigo-600 text-white'
                      : msg.isError
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow">
                  <div className="flex space-x-2">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============ ADMIN PORTAL COMPONENTS ============

// Admin Dashboard - Overview
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/admin/statistics');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch admin statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8">Loading statistics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">System Overview</div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Teachers</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalTeachers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Students</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Admins</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalAdmins}</p>
              </div>
              <Award className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Average Attendance</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.averageAttendance}%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Low Attendance</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowAttendanceStudents}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Good Attendance</p>
              <p className="text-3xl font-bold text-green-600">{stats.goodAttendanceStudents}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Teachers Management
function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await api.get('/admin/teachers');
        setTeachers(data);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  if (loading) return <div className="text-center py-8">Loading teachers...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Teacher Management</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Total Teachers: {teachers.length}</p>
        </div>
        
        {teachers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No teachers found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{teacher.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                  <td className="px-6 py-4 text-sm"><span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">{teacher.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Admin Students Management
function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let data = await api.get('/admin/students');
        if (classFilter) {
          data = data.filter(s => s.className === classFilter);
        }
        setStudents(data);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [classFilter]);

  if (loading) return <div className="text-center py-8">Loading students...</div>;

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
        <input
          type="text"
          placeholder="Filter by class..."
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Total Students: {students.length}</p>
        </div>
        
        {students.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No students found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Roll No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Section</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{student.rollNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{student.className}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.section || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAttendanceColor(student.attendancePercentage)}`}>
                      {student.attendancePercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Admin Attendance Monitoring
function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await api.get('/admin/attendance');
        setAttendance(data);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) return <div className="text-center py-8">Loading attendance...</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Attendance Monitoring</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Total Records: {attendance.length}</p>
        </div>
        
        {attendance.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No attendance records found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attendance.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{record.studentId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Admin Reports
function AdminReports() {
  const [classStats, setClassStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await api.get('/admin/statistics/class');
        setClassStats(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="text-center py-8">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classStats.map(classData => (
          <div key={classData.className} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{classData.className}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Students:</span>
                <span className="font-bold text-indigo-600">{classData.studentCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Attendance:</span>
                <span className="font-bold text-green-600">{classData.averageAttendance}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Low Attendance:</span>
                <span className="font-bold text-red-600">{classData.lowAttendanceCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{width: `${classData.averageAttendance}%`}}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin Users Management
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await api.get('/admin/users');
        const statsData = await api.get('/admin/users/statistics/role');
        setUsers(usersData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="text-center py-8">Loading users...</div>;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'TEACHER': return 'bg-indigo-100 text-indigo-800';
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
      
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <p className="text-sm text-gray-600">Teachers</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.TEACHER}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600">Students</p>
            <p className="text-3xl font-bold text-blue-600">{stats.STUDENT}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-3xl font-bold text-purple-600">{stats.ADMIN}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Total Users: {users.length}</p>
        </div>
        
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============ TEACHER PORTAL COMPONENTS ============

// Manage Students Component - Full CRUD
function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    userId: 1,
    rollNo: '',
    className: '',
    section: '',
    phone: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get('/students');
      setStudents(data);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE
        await api.put(`/students/${editingId}`, formData);
        setSuccess('✅ Student updated successfully!');
      } else {
        // CREATE
        await api.post('/students', formData);
        setSuccess('✅ Student added successfully!');
      }
      setFormData({ userId: 1, rollNo: '', className: '', section: '', phone: '' });
      setShowForm(false);
      setEditingId(null);
      fetchStudents();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('❌ Failed to save student: ' + err.message);
      console.error(err);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      userId: student.userId,
      rollNo: student.rollNo,
      className: student.className,
      section: student.section,
      phone: student.phone
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/students/${id}`);
        setSuccess('✅ Student deleted successfully!');
        fetchStudents();
        setTimeout(() => setSuccess(''), 2000);
      } catch (err) {
        setError('❌ Failed to delete student: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ userId: 1, rollNo: '', className: '', section: '', phone: '' });
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          {showForm ? 'Cancel' : '➕ Add Student'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll No *</label>
                <input
                  type="text"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleInputChange}
                  placeholder="e.g., A001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  placeholder="e.g., 10-A"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  placeholder="e.g., A"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {editingId ? 'Update Student' : 'Add Student'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No students added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add First Student
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.rollNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.section}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {student.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      student.attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                      student.attendancePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.attendancePercentage ? `${student.attendancePercentage.toFixed(1)}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleEdit(student)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mr-2"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Good Attendance</p>
            <p className="text-2xl font-bold text-green-600">{students.filter(s => s.attendancePercentage >= 75).length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Average Attendance</p>
            <p className="text-2xl font-bold text-yellow-600">{students.length > 0 ? (students.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / students.length).toFixed(1) : 0}%</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Low Attendance</p>
            <p className="text-2xl font-bold text-red-600">{students.filter(s => s.attendancePercentage < 75).length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Teacher Dashboard Component - Real API Integration
function TeacherDashboard() {
  const [dashData, setDashData] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lowAttendance: 0,
    avgAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const students = await api.get('/students');
        const attendance = await api.get('/attendance');
        const lowAttendanceStudents = await api.get('/students/low-attendance');

        const totalStudents = students.length;
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(a => a.attendanceDate === today);
        const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
        const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;

        let avgAttendance = 0;
        if (students.length > 0) {
          avgAttendance = (students.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / students.length).toFixed(1);
        }

        setDashData({
          totalStudents,
          presentToday,
          absentToday,
          lowAttendance: lowAttendanceStudents.length,
          avgAttendance
        });
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const weeklyData = [
    { day: 'Mon', present: dashData.presentToday, absent: dashData.absentToday },
    { day: 'Tue', present: dashData.presentToday - 2, absent: dashData.absentToday + 1 },
    { day: 'Wed', present: dashData.presentToday, absent: dashData.absentToday - 1 },
    { day: 'Thu', present: dashData.presentToday + 1, absent: dashData.absentToday },
    { day: 'Fri', present: dashData.presentToday - 1, absent: dashData.absentToday + 2 }
  ];

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">Total Students</p>
          <p className="text-3xl font-bold">{dashData.totalStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">Present Today</p>
          <p className="text-3xl font-bold">{dashData.presentToday}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">Absent Today</p>
          <p className="text-3xl font-bold">{dashData.absentToday}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">Low Attendance</p>
          <p className="text-3xl font-bold">{dashData.lowAttendance}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <p className="text-sm opacity-90">Avg Attendance</p>
          <p className="text-3xl font-bold">{dashData.avgAttendance}%</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Attendance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#10B981" name="Present" />
            <Bar dataKey="absent" fill="#EF4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Teacher Mark Attendance Component - Real CRUD
function TeacherMarkAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkAction, setBulkAction] = useState('PRESENT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await api.get('/students');
        
        // Initialize with empty attendance status
        const studentsWithStatus = studentsData.map(s => ({
          ...s,
          status: null
        }));
        setStudents(studentsWithStatus);
        
        // Load existing attendance for this date
        const allAttendance = await api.get('/attendance');
        const dateAttendance = {};
        allAttendance
          .filter(a => a.attendanceDate === selectedDate)
          .forEach(a => {
            dateAttendance[a.studentId] = a.status;
          });
        setAttendance(dateAttendance);
      } catch (err) {
        setError('Failed to fetch students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleBulkMarkAll = () => {
    const newAttendance = {};
    students.forEach(s => {
      newAttendance[s.id] = bulkAction;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate that at least some attendance is marked
      if (Object.keys(attendance).length === 0) {
        setError('❌ Please mark attendance for at least one student');
        setSaving(false);
        return;
      }

      const attendanceData = students.map(s => ({
        studentId: s.id,
        attendanceDate: selectedDate,
        status: attendance[s.id] || 'ABSENT',
        remarks: ''
      }));

      // Try batch create
      const response = await fetch('http://localhost:8080/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`✅ Attendance marked and saved successfully! (${data.length} records)`);
        
        // Reset after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const errorText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response body:', errorText);
        
        if (response.status === 400) {
          setError('❌ Error: Invalid attendance data. Please check student IDs and try again.');
        } else if (response.status === 500) {
          setError('❌ Server error: Failed to save attendance. Please check the backend.');
        } else {
          setError(`❌ Failed to save attendance (Status: ${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('❌ Failed to save attendance: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const markedCount = Object.keys(attendance).length;

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{success}</div>}

      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : (
        <>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Bulk Actions */}
        <div className="flex items-center space-x-3 mb-4">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="PRESENT">Mark All Present</option>
            <option value="ABSENT">Mark All Absent</option>
            <option value="LATE">Mark All Late</option>
          </select>
          <button
            onClick={handleBulkMarkAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply to All
          </button>
          <span className="text-sm text-gray-600 ml-auto">
            Marked: {markedCount}/{students.length}
          </span>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.rollNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {student.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center space-x-2">
                    {['PRESENT', 'ABSENT', 'LATE'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          attendance[student.id] === status
                            ? status === 'PRESENT' ? 'bg-green-500 text-white'
                            : status === 'ABSENT' ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {status.slice(0, 1)}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save Attendance'}
      </button>
        </>
      )}
    </div>
  );
}

// AI Performance Analysis Component
function AIPerformanceAnalysis() {
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        // Fetch all students
        const students = await api.get('/students');
        
        // Calculate performance level based on attendance
        const performance = students.map(student => {
          const attendance = student.attendancePercentage || 0;
          let level, trend, recommendation;
          
          if (attendance >= 95) {
            level = 'Excellent';
            trend = '↑';
            recommendation = 'Maintain current performance level';
          } else if (attendance >= 85) {
            level = 'Very Good';
            trend = '↑';
            recommendation = 'Continue excellent work';
          } else if (attendance >= 75) {
            level = 'Good';
            trend = '→';
            recommendation = 'Improve consistency in attendance';
          } else if (attendance >= 60) {
            level = 'At Risk';
            trend = '↓';
            recommendation = 'Encourage regular attendance';
          } else {
            level = 'Critical';
            trend = '↓';
            recommendation = 'Urgent: Discuss with parents';
          }
          
          return {
            id: student.id,
            name: student.name || `Student ${student.id}`,
            attendance: attendance.toFixed(1),
            performance: level,
            trend,
            recommendation
          };
        });
        
        setStudentPerformance(performance);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  const getColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'Very Good': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'At Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) return <div className="text-center py-8">Loading performance analysis...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI-Powered Performance Analysis</h2>
      
      {studentPerformance.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No student data available</p>
      ) : (
        studentPerformance.map((student) => (
          <div key={student.id} className={`border-l-4 rounded-lg p-6 ${getColor(student.performance)}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{student.name}</h3>
                <p className="text-sm mb-2">Attendance: <span className="font-bold">{student.attendance}%</span> {student.trend}</p>
                <p className="text-sm mb-3"><span className="font-semibold">Performance Level:</span> {student.performance}</p>
                <p className="text-sm"><span className="font-semibold">AI Recommendation:</span> {student.recommendation}</p>
              </div>
              <span className="text-2xl font-bold opacity-50">{student.performance === 'Excellent' ? '⭐' : student.performance === 'Critical' ? '🔴' : '📊'}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Low Attendance Alert Component
function LowAttendanceAlert() {
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const fetchLowAttendanceStudents = async () => {
      try {
        setLoading(true);
        // Fetch all students
        const students = await api.get('/students');
        
        // Filter students with attendance < 75%
        const lowAttendance = students
          .filter(s => (s.attendancePercentage || 0) < 75)
          .map(student => {
            const totalDays = student.totalDays || 0;
            const presentDays = student.presentDays || 0;
            return {
              id: student.id,
              name: student.name || `Student ${student.id}`,
              rollNo: student.rollNo,
              attendance: (student.attendancePercentage || 0).toFixed(1),
              days: `${presentDays}/${totalDays}`,
              reason: 'Below 75% threshold - requires intervention'
            };
          });
        
        setLowAttendanceStudents(lowAttendance);
      } catch (err) {
        console.error('Failed to fetch low attendance students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLowAttendanceStudents();
  }, []);

  const handleSendMessage = () => {
    if (selectedStudent && messageText.trim()) {
      console.log(`Message sent to ${selectedStudent.name}: ${messageText}`);
      alert(`Message sent to ${selectedStudent.name} and parent`);
      setMessageText('');
      setSelectedStudent(null);
    }
  };

  if (loading) return <div className="text-center py-8">Loading low attendance students...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Student List */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <h2 className="text-lg font-bold text-red-800">⚠️ Low Attendance Alert</h2>
          <p className="text-sm text-red-700">Students with attendance below 75%</p>
        </div>
        
        {lowAttendanceStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No students with low attendance</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lowAttendanceStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 border-l-4 cursor-pointer transition-colors ${
                  selectedStudent?.id === student.id
                    ? 'bg-red-50 border-red-500'
                    : 'bg-white border-red-300 hover:bg-red-25'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.rollNo}</p>
                    <p className="text-xs text-gray-500 mt-1">Reason: {student.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{student.attendance}%</p>
                    <p className="text-xs text-gray-600">{student.days} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 h-fit">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Send Alert</h3>
        
        {selectedStudent ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">{selectedStudent.name}</p>
              <p className="text-xs text-blue-700">Attendance: {selectedStudent.attendance}%</p>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write message to send to student and parent..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none h-24"
            />

            <button
              onClick={handleSendMessage}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Send Alert
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-8">Select a student to send a message</p>
        )}
      </div>
    </div>
  );
}

// Message Notifications Component
function MessageNotifications() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Since there's no dedicated messages endpoint, generate messages from attendance data
        // In a real application, this would come from a messages table
        const students = await api.get('/students');
        
        // Generate system messages based on student data
        const generatedMessages = [];
        
        // Add a system message
        generatedMessages.push({
          id: 'sys-1',
          type: 'system',
          student: '',
          message: 'Daily attendance report generated',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Info'
        });
        
        // Add alerts for low attendance students
        students
          .filter(s => (s.attendancePercentage || 0) < 75)
          .slice(0, 3)
          .forEach((student, idx) => {
            generatedMessages.push({
              id: `alert-${idx}`,
              type: 'alert',
              student: student.name || `Student ${student.id}`,
              message: `Alert sent: Low attendance warning (${student.attendancePercentage}%)`,
              time: '2 hours ago',
              status: 'Delivered'
            });
          });
        
        setMessages(generatedMessages);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        // Set default messages on error
        setMessages([{
          id: 'err-1',
          type: 'system',
          student: '',
          message: 'Attendance system active',
          time: new Date().toLocaleTimeString(),
          status: 'Info'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">📤 {status}</span>;
      case 'Read':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ {status}</span>;
      case 'Info':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">ℹ️ {status}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  if (loading) return <div className="text-center py-8">Loading messages...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Message Center</h2>
      
      {messages.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No messages</p>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-800">
                    {msg.type === 'alert' ? '⚠️' : msg.type === 'reply' ? '💬' : 'ℹ️'} {msg.student || msg.message}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                <p className="text-xs text-gray-500">{msg.time}</p>
              </div>
              <div>{getStatusBadge(msg.status)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============ ADMIN CREATE STUDENT - ENHANCED UI ============
function AdminCreateStudent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    className: '',
    section: '',
    phone: '',
    totalDays: 200
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formValid, setFormValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      ...formData,
      [name]: name === 'totalDays' ? parseInt(value) : value
    };
    setFormData(updated);
    
    // Validate form
    const isValid = updated.name && updated.email && updated.password && 
                   updated.rollNo && updated.className;
    setFormValid(isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/admin/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Student created successfully! ID: ${data.userId}`);
        setFormData({
          name: '',
          email: '',
          password: '',
          rollNo: '',
          className: '',
          section: '',
          phone: '',
          totalDays: 200
        });
        setFormValid(false);
      } else {
        setError(`❌ Error: ${data.details}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">👨‍🎓</span>
            Create Student Profile
          </h2>
          <p className="text-indigo-100 mt-2">Add new student with login credentials</p>
        </div>

        <div className="p-8">
          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-r-lg">
              <p className="font-semibold">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Login Credentials */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔐</span> Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="student@school.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                🎲 Generate Secure Password
              </button>
            </div>

            {/* Section 3: Academic Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎓</span> Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Roll Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="CS001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="10A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="A"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Teaching Days
                </label>
                <input
                  type="number"
                  name="totalDays"
                  value={formData.totalDays}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '⏳ Creating Student...' : '✓ Create Student Profile'}
            </button>
          </form>

          {/* Info Box */}
          {formData.email && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">📝 Login Credentials Preview:</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Email: <code className="bg-white px-2 py-1 rounded">{formData.email}</code></p>
                <p>Password: <code className="bg-white px-2 py-1 rounded">{formData.password || '[pending]'}</code></p>
                <p className="text-xs text-blue-700 mt-2">💡 Share these credentials with the student</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN CREATE TEACHER - ENHANCED UI ============
function AdminCreateTeacher() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    subject: '',
    yearsOfExperience: '',
    qualification: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formValid, setFormValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      ...formData,
      [name]: name === 'yearsOfExperience' ? parseInt(value) || '' : value
    };
    setFormData(updated);

    // Validate form
    const isValid = updated.name && updated.email && updated.password;
    setFormValid(isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/admin/teachers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Teacher created successfully! ID: ${data.userId}`);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          subject: '',
          yearsOfExperience: '',
          qualification: ''
        });
        setFormValid(false);
      } else {
        setError(`❌ Error: ${data.details}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'History', 'Geography', 'Physical Education', 'Art'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">👨‍🏫</span>
            Create Teacher Profile
          </h2>
          <p className="text-green-100 mt-2">Add new teacher with login credentials</p>
        </div>

        <div className="p-8">
          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-r-lg">
              <p className="font-semibold">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Mrs. Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Login Credentials */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔐</span> Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="teacher@school.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Enter secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                🎲 Generate Secure Password
              </button>
            </div>

            {/* Section 3: Professional Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎓</span> Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="5"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Qualification
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="M.Tech, B.Tech, M.A, B.A, etc."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '⏳ Creating Teacher...' : '✓ Create Teacher Profile'}
            </button>
          </form>

          {/* Info Box */}
          {formData.email && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <p className="text-sm font-semibold text-green-900 mb-2">📝 Login Credentials Preview:</p>
              <div className="space-y-1 text-sm text-green-800">
                <p>Email: <code className="bg-white px-2 py-1 rounded">{formData.email}</code></p>
                <p>Password: <code className="bg-white px-2 py-1 rounded">{formData.password || '[pending]'}</code></p>
                {formData.subject && <p>Subject: <code className="bg-white px-2 py-1 rounded">{formData.subject}</code></p>}
                <p className="text-xs text-green-700 mt-2">💡 Share these credentials with the teacher</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
