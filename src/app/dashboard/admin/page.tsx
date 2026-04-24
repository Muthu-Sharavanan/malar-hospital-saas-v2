'use client';
import { useState, useEffect, useCallback } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, 
  Activity, 
  Calendar, 
  LayoutDashboard,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  UserSquare2,
  X,
  Clock,
  Stethoscope,
  Trash2,
  CheckCircle,
  FlaskConical,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState<'performance' | 'doctors' | 'patients'>('performance');
  const [doctorList, setDoctorList] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Patient Records State
  const [patientList, setPatientList] = useState<any[]>([]);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientPage, setPatientPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientLoading, setPatientLoading] = useState(false);

  // Visit History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<any>(null);
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Secure Password Modal State
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean, type: 'SINGLE' | 'ALL' | null, patientId?: string, patientName?: string }>({ isOpen: false, type: null });
  const [passwordInput, setPasswordInput] = useState('');

  const handleLiveReset = async () => {
    if (!confirm("⚠️ LIVE RESET: This will clear all test data and prepare professional demo patients. Continue?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        alert("✅ RESET SUCCESSFUL! Redirecting to login...");
        window.location.href = '/';
      } else {
        alert("Reset failed: " + data.error);
      }
    } catch (err) {
      alert("Reset failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/users?role=DOCTOR');
      const data = await res.json();
      if (data.success) setDoctorList(data.users);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const fetchPatientRecords = useCallback(async (page = 1, search = '') => {
    setPatientLoading(true);
    try {
      const res = await fetch(`/api/patients?all=true&page=${page}&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setPatientList(data.patients);
        setPatientTotal(data.total);
        setPatientPage(data.page);
        setPatientTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const handleDeletePatient = (patientId: string, patientName: string) => {
    setPasswordModal({ isOpen: true, type: 'SINGLE', patientId, patientName });
    setPasswordInput('');
  };

  const handleDeleteAllPatients = () => {
    setPasswordModal({ isOpen: true, type: 'ALL' });
    setPasswordInput('');
  };

  const confirmDelete = async () => {
    if (!passwordInput) return;
    setPatientLoading(true);
    setPasswordModal({ isOpen: false, type: null });
    
    try {
      const isAll = passwordModal.type === 'ALL';
      const endpoint = isAll ? '/api/patients/delete-all' : `/api/patients/${passwordModal.patientId}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (data.success) {
        alert(isAll ? "All patients entirely deleted." : `Patient ${passwordModal.patientName} entirely deleted.`);
        fetchPatientRecords(isAll ? 1 : patientPage, isAll ? '' : patientSearch);
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      alert("Delete failed: " + err);
    } finally {
      setPatientLoading(false);
      setPasswordInput('');
    }
  };

  const fetchPatientHistory = async (patient: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHistoryPatient(patient);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/history`);
      const data = await res.json();
      if (data.success) setHistoryVisits(data.history);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setUserName(data.user.name);
        setShift(data.shift);
      }
    } catch (err) {
      console.error("Failed to fetch session", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchStats();
    fetchDoctors();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeView === 'patients') {
      fetchPatientRecords(1, patientSearch);
    }
  }, [activeView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0A4D68', '#088395', '#16698b', '#05bfdb'];

  // --- CLINICAL PERFORMANCE ANALYTICS ---

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Old Format with New Icons */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s' }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Admin</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <button 
             onClick={() => { setActiveView('performance'); setIsSidebarOpen(false); }}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: activeView === 'performance' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <LayoutDashboard size={20} style={{ opacity: activeView === 'performance' ? 1 : 0.6 }} /> 
            <span style={{ fontWeight: activeView === 'performance' ? '600' : '400' }}>Performance</span>
          </button>
          
          <button 
             onClick={() => { setActiveView('doctors'); setIsSidebarOpen(false); }}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: activeView === 'doctors' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <Users size={20} style={{ opacity: activeView === 'doctors' ? 1 : 0.6 }} /> 
            <span style={{ fontWeight: activeView === 'doctors' ? '600' : '400' }}>Doctors List</span>
          </button>

          <button 
             onClick={() => { setActiveView('patients'); setIsSidebarOpen(false); }}
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: activeView === 'patients' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <UserSquare2 size={20} style={{ opacity: activeView === 'patients' ? 1 : 0.6 }} /> 
            <span style={{ fontWeight: activeView === 'patients' ? '600' : '400' }}>Patient Records</span>
          </button>

          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <FileText size={20} />
            <span>Reports</span>
          </div>

          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <Settings size={20} />
            <span>Configuration</span>
          </div>
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }}>
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>
               {activeView === 'performance' ? 'System Overview' : activeView === 'doctors' ? 'Doctors Directory' : 'Patient Records'}
            </h1>
            <p style={{ color: '#64748B', margin: 0, fontSize: '18px', fontWeight: '400' }}>
               <Calendar size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
               {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} | Thoothukudi
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#E2E8F0', padding: '10px 25px', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#0A4D68', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>{(() => {
                const hour = currentTime.getHours();
                if (hour >= 6 && hour < 14) return 'MORNING SHIFT';
                if (hour >= 14 && hour < 22) return 'EVENING SHIFT';
                return 'NIGHT SHIFT';
              })()}</span>
            </div>
            <div className="relative">
               <Bell size={24} style={{ color: '#94A3B8' }} />
               <span style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid white' }}></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '25px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B', textTransform: 'uppercase' }}>{userName || 'Admin'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>MALAR HOSPITAL</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                 {userName ? userName.charAt(0) : 'A'}
              </div>
            </div>
          </div>
        </header>

        {activeView === 'performance' ? (
          <>
            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
              <StatCard 
                  label="New Registrations (Today)" 
                  value={stats?.totalPatients || 0} 
                  icon={<Users className="text-secondary" style={{ color: '#0A4D68' }} />} 
                  trend={stats?.totalPatientsMonth || 0}
                  trendLabel="this month"
              />
              <StatCard 
                  label="Active Today" 
                  value={stats?.activeToday || 0} 
                  icon={<Activity style={{ color: '#14B8A6' }} />} 
                  trend="+12%"
                  isPositive={true}
              />
              <StatCard 
                  label="Completed Consultations" 
                  value={stats?.completedCount || 0} 
                  icon={<CheckCircle style={{ color: '#059669' }} />} 
              />
              <StatCard 
                  label="Pending Lab Reports" 
                  value={stats?.pendingLabs || 0} 
                  icon={<FlaskConical style={{ color: '#D97706' }} />} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px', alignItems: 'stretch' }}>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(248, 250, 252, 0.5)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>7-Day Patient Traffic</h4>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Daily registration volume vs previous period</p>
                  </div>
                </div>
                <div style={{ flex: '1', height: '300px', width: '100%', padding: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.sevenDayTrend || []}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px'}}
                      />
                      <Area type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>Visit Distribution</h4>
                <div style={{ flex: '1', height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(stats?.visitBreakdown || {}).map(([name, value]) => ({ name, value }))}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(stats?.visitBreakdown || {}).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={['#0A4D68', '#14B8A6', '#0891B2', '#1E293B'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   {Object.entries(stats?.visitBreakdown || {}).map(([name, value]: [string, any], idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ['#0A4D68', '#14B8A6', '#0891B2', '#1E293B'][idx % 4] }}></span>
                            <span style={{ color: '#64748B', fontWeight: '500' }}>{name}</span>
                         </span>
                         <span style={{ fontWeight: 'bold', color: '#334155' }}>{value} visits</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'stretch' }}>
              <div className="glass-card" style={{ flex: '1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Clinical Activity</h4>
                      <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Live patient flow and status updates</p>
                    </div>
                    <button style={{ fontSize: '12px', fontWeight: 'bold', color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9' }}>
                          <th style={{ paddingBottom: '12px' }}>Patient</th>
                          <th style={{ paddingBottom: '12px' }}>UHID</th>
                          <th style={{ paddingBottom: '12px' }}>Time</th>
                          <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: '12px' }}>
                        {patientList.slice(0, 5).map((p: any) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '12px 0', fontWeight: 'bold', color: '#334155' }}>{p.name}</td>
                            <td style={{ padding: '12px 0', color: '#64748B' }}>{p.uhid}</td>
                            <td style={{ padding: '12px 0', color: '#94A3B8' }}>{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '12px 0', textAlign: 'right' }}>
                              <button 
                                onClick={() => handleDeletePatient(p.id, p.name)} 
                                style={{ background: '#FEE2E2', color: '#EF4444', padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Efficiency Metrics</h4>
                    <MetricRow label="Consultation Rate" value="92%" isUp={true} />
                    <MetricRow label="Lab Conversion" value="65%" isUp={false} />
                    <MetricRow label="Wait Time avg." value="14m" isUp={true} />
                  </div>
              </div>
            </div>
          </>
        ) : activeView === 'doctors' ? (
          <div className="glass-card animate-fade-in">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-slate-800">Registered Medical Practitioners</h3>
                <div className="flex gap-2">
                   <button className="btn btn-primary !rounded-lg !py-2">
                      <Users size={16} /> Add New Doctor
                   </button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <th className="pb-4 px-4">Doctor Name</th>
                         <th className="pb-4 px-4">Role</th>
                         <th className="pb-4 px-4">Contact Email</th>
                         <th className="pb-4 px-4">Status</th>
                         <th className="pb-4 px-4">Action</th>
                      </tr>
                   </thead>
                   <tbody>
                      {doctorList.map((doc) => (
                         <tr key={doc.id} className="border-b border-slate-50 group hover:bg-slate-50-50 transition-colors">
                            <td className="py-4 px-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                     {(() => {
                                      const nameToUse = doc.name.trim().replace(/^(dr\.?\s*)+/i, '');
                                       return nameToUse.charAt(0).toUpperCase() || '?';
                                     })()}
                                  </div>
                                  <span className="font-bold text-slate-700">{`Dr. ${doc.name.trim().replace(/^(dr\.?\s*)+/i, '')}`}</span>
                               </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-500 font-medium">{doc.role}</td>
                            <td className="py-4 px-4 text-sm text-slate-500">{doc.email}</td>
                            <td className="py-4 px-4">
                               <span className="badge badge-success">Active</span>
                            </td>
                            <td className="py-4 px-4">
                               <button className="text-slate-400 hover:text-primary transition-colors">
                                 <Settings size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        ) : (
          /* ── Patient Records Panel ── */
          <div className="glass-card animate-fade-in">
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">All Registered Patients</h3>
                <p className="text-xs text-slate-400 mt-1">{patientTotal} patients in the system</p>
              </div>
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72" style={{ height: '40px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search name, phone, UHID..."
                    value={patientSearch}
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      fetchPatientRecords(1, e.target.value);
                    }}
                    style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '40px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#1E293B', margin: 0 }}
                  />
                </div>
                <button 
                  onClick={handleDeleteAllPatients} 
                  style={{ background: '#FEE2E2', color: '#EF4444', padding: '0', margin: '0', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', width: '40px', flexShrink: 0 }}
                  title="Delete All Patients (Requires Password)"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-3 px-3">UHID</th>
                    <th className="pb-3 px-3">Patient Name</th>
                    <th className="pb-3 px-3">Age / Gender</th>
                    <th className="pb-3 px-3">Phone</th>
                    <th className="pb-3 px-3">Address</th>
                    <th className="pb-3 px-3">Visits</th>
                    <th className="pb-3 px-3">Registered On</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patientLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">Loading patients...</td>
                    </tr>
                  ) : patientList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">No patients found.</td>
                    </tr>
                  ) : patientList.map((p: any) => (
                    <tr
                      key={p.id}
                      onClick={() => fetchPatientHistory(p)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseOut={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td className="py-3 px-3">
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {p.uhid}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0A4D68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-700 text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-600">{p.age}Y &nbsp;/&nbsp; {p.gender}</td>
                      <td className="py-3 px-3 text-sm text-slate-600">{p.phone || <span className="text-slate-300 italic">—</span>}</td>
                      <td className="py-3 px-3 text-sm text-slate-500" style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.address || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span style={{ background: p._count.visits > 0 ? '#F0FDF4' : '#F8FAFC', color: p._count.visits > 0 ? '#15803D' : '#94A3B8', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {p._count.visits} visit{p._count.visits !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>View →</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id, p.name); }} 
                            style={{ background: '#FEE2E2', color: '#EF4444', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex' }}
                            title="Delete Patient Entirely"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {patientTotalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Page {patientPage} of {patientTotalPages} &nbsp;·&nbsp; {patientTotal} total patients
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { const p = patientPage - 1; setPatientPage(p); fetchPatientRecords(p, patientSearch); }}
                    disabled={patientPage <= 1}
                    style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', background: 'white', cursor: patientPage <= 1 ? 'not-allowed' : 'pointer', opacity: patientPage <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => { const p = patientPage + 1; setPatientPage(p); fetchPatientRecords(p, patientSearch); }}
                    disabled={patientPage >= patientTotalPages}
                    style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', background: 'white', cursor: patientPage >= patientTotalPages ? 'not-allowed' : 'pointer', opacity: patientPage >= patientTotalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Visit History Modal ── */}
      {showHistoryModal && historyPatient && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#0A4D68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                  {historyPatient.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A' }}>{historyPatient.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '10px', marginTop: '2px' }}>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1px 7px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{historyPatient.uhid}</span>
                    <span>{historyPatient.age}Y · {historyPatient.gender}</span>
                    {historyPatient.phone && <span>📞 {historyPatient.phone}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            {/* Summary Strip */}
            <div style={{ padding: '16px 28px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#0A4D68" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A4D68' }}>{historyLoading ? '...' : historyVisits.length} Total Visit{historyVisits.length !== 1 ? 's' : ''}</span>
              </div>
              {historyVisits.length > 0 && (
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Last visit: <strong>{new Date(historyVisits[0].visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
              )}
            </div>

            {/* Visit List */}
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontStyle: 'italic' }}>Loading visit history...</div>
              ) : historyVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontStyle: 'italic' }}>No visits found for this patient.</div>
              ) : historyVisits.map((v: any, idx: number) => (
                <div key={v.id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Visit Header */}
                  <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0A4D68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                        {historyVisits.length - idx}
                      </span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>
                          {new Date(v.visitDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Token #{v.tokenNumber}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Stethoscope size={13} color="#64748B" />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#0A4D68' }}>
                        Dr. {v.doctor?.name?.trim().replace(/^(dr\.?\s*)+/i, '') || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {/* Visit Body */}
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'white' }}>
                    {v.chiefComplaints ? (
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        <span style={{ fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Chief Complaints</span>
                        <p style={{ margin: '4px 0 0 0', color: '#1E293B' }}>{v.chiefComplaints}</p>
                      </div>
                    ) : null}
                    {v.diagnosis ? (
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: v.chiefComplaints ? '6px' : 0 }}>
                        <span style={{ fontWeight: '700', color: '#64748B', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Diagnosis</span>
                        <p style={{ margin: '4px 0 0 0', color: '#1E293B', fontWeight: '600' }}>{v.diagnosis}</p>
                      </div>
                    ) : null}
                    {!v.chiefComplaints && !v.diagnosis && (
                      <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>No consultation notes recorded yet.</p>
                    )}
                    {(v.prescriptions?.length > 0 || v.labOrders?.length > 0) && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                        {v.prescriptions?.length > 0 && (
                          <span style={{ fontSize: '11px', background: '#F0FDF4', color: '#15803D', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                            💊 {v.prescriptions.length} Med{v.prescriptions.length > 1 ? 's' : ''}: {v.prescriptions.slice(0, 3).map((p: any) => p.drugName).join(', ')}{v.prescriptions.length > 3 ? '...' : ''}
                          </span>
                        )}
                        {v.labOrders?.length > 0 && (
                          <span style={{ fontSize: '11px', background: '#FFF7ED', color: '#C2410C', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                            🧪 {v.labOrders.length} Lab Test{v.labOrders.length > 1 ? 's' : ''}: {v.labOrders.slice(0, 2).map((l: any) => l.testName).join(', ')}{v.labOrders.length > 2 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Password Security Modal ── */}
      {passwordModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '400px', textAlign: 'center', padding: '30px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} className="animate-fade-in">
            <div style={{ color: '#EF4444', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <Trash2 size={48} />
            </div>
            <h2 style={{ marginBottom: '10px', fontSize: '24px', fontWeight: 'bold', color: '#0F172A' }}>Security Verification</h2>
            <p style={{ color: '#64748B', marginBottom: '25px', fontSize: '14px' }}>
              {passwordModal.type === 'ALL' 
                ? 'You are about to permanently delete ALL patients and their associated records. This action cannot be undone.'
                : `You are about to permanently delete patient ${passwordModal.patientName} and all associated records. This action cannot be undone.`
              }
            </p>
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>Enter Master Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                autoFocus
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmDelete(); }}
                style={{ width: '100%', height: '50px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 15px', fontSize: '16px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => { setPasswordModal({ isOpen: false, type: null }); setPasswordInput(''); }}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all group ${
        active 
        ? 'bg-white text-primary shadow-lg font-bold' 
        : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-white/40 group-hover:text-white transition-colors'}>{icon}</span>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>}
    </a>
  );
}

function StatCard({ label, value, icon, trend, isPositive, trendLabel = "vs yesterday" }: any) {
  return (
    <div className="glass-card hover-scale-102 transition-transform duration-300">
       <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isPositive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}% {trendLabel && <span className="text-[8px] opacity-60 ml-0.5">{trendLabel}</span>}
            </div>
          )}
       </div>
       <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
          <span className="text-2xl font-bold text-slate-800 leading-none">{value}</span>
       </div>
    </div>
  );
}

function MetricRow({ label, value, isUp }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
       <span className="text-xs font-medium text-slate-500">{label}</span>
       <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">{value}</span>
          {isUp ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
       </div>
    </div>
  );
}
