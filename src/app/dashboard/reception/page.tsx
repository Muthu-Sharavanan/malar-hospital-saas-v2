'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Users, 
  UserPlus, 
  CalendarCheck, 
  UserRoundCheck, 
  Stethoscope, 
  Search, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  Printer,
  History,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ChevronRight,
  X,
  CreditCard,
  FileText,
  ChevronDown,
  Clipboard,
  FileSearch
} from 'lucide-react';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionFilter, setSessionFilter] = useState<'morning' | 'evening'>(
    new Date().getHours() < 12 ? 'morning' : 'evening'
  );
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [futureQueue, setFutureQueue] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  
  // Modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [billingForm, setBillingForm] = useState({ discount: 0, paymentMode: 'CASH', waiverReason: '', authorizingDoc: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<{patient: any, history: any[]}|null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string, token: string, uhid?: string, whatsappSent?: boolean}|null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalData, setStatsModalData] = useState<{title: string, list: any[]}|null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{title: string, message: string}|null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: '', patientId: '', visitDate: '', visitTime: '', timeSession: 'AM', reason: '', abhaId: '', consentGranted: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchDoctors = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/users?role=DOCTOR&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.users);
        if (data.users.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: data.users[0].id }));
        }
      }
    } catch (err) {} finally { setTimeout(() => setIsRefreshing(false), 600); }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/register?session=${sessionFilter}`);
      const data = await res.json();
      if (data.success) setQueue(data.visits || data.queue || []);
    } catch (err) {}
  };

  const fetchFutureQueue = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.success) {
        const midnightToday = new Date();
        midnightToday.setHours(23, 59, 59, 999);
        const upcoming = data.visits.filter((v: any) => new Date(v.visitDate) > midnightToday);
        setFutureQueue(upcoming);
      }
    } catch (err) {}
  };

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/billing');
      const data = await res.json();
      if (data.success) setBills(data.bills);
    } catch (err) {}
  };

  useEffect(() => {
    fetchSession();
    fetchDoctors();
    fetchQueue();
    fetchBills();
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setShift(now.getHours() < 12 ? 'Morning' : 'Evening');
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionFilter]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.success) {
        setUserName(data.user.name);
        setShift(data.shift);
      }
    } catch (err) {}
  };

  const fetchPatients = async (query: string) => {
    if (!query) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/patients?q=${query}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.patients);
        setShowSearchResults(true);
      }
    } catch (err) {}
  };

  // Reset expanded visit when modal closes
  useEffect(() => {
    if (!showHistoryModal) {
      setExpandedVisitId(null);
    }
  }, [showHistoryModal]);

  useEffect(() => {
    if (formData.phone.length === 10) {
      fetchPatients(formData.phone);
    } else if (formData.phone.length === 0) {
      setSelectedPatient(null);
    }
  }, [formData.phone]);

  const fetchHistory = async (patientId: string) => {
    try {
      setShowHistoryModal(true);
      setLoadingHistory(true);
      setHistoryData(null); // Clear previous
      const res = await fetch(`/api/patients/${patientId}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData({ patient: data.patient, history: data.history });
      }
    } catch (err) {} finally { setLoadingHistory(false); }
  };

  const selectPatient = (patient: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedPatient(patient);
    setFormData({
      ...formData,
      patientId: patient.id,
      name: patient.name,
      phone: patient.phone || '',
      age: patient.age.toString(),
      gender: patient.gender,
      address: patient.address || '',
      visitDate: '',
      visitTime: '',
      reason: ''
    });
    setSearchQuery(patient.phone || patient.name);
    setShowSearchResults(false);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setFormData({ name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: doctors[0]?.id || '', patientId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false });
    setSearchQuery('');
  };

  useEffect(() => {
    if (activeTab === 'register') fetchDoctors();
    if (activeTab === 'queue') fetchQueue();
    if (activeTab === 'future') fetchFutureQueue();
    if (activeTab === 'billing') { fetchBills(); fetchDoctors(); }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          visitTime: formData.visitTime ? `${formData.visitTime} ${formData.timeSession}` : '' 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessInfo({
          title: data.isNewPatient ? "New Patient Registered!" : "Registration Successful!",
          message: data.isNewPatient ? `Permanent ID created for ${formData.name}.` : `${formData.name} added to queue.`,
          token: data.visit.tokenNumber,
          uhid: data.uhid,
          whatsappSent: !!formData.visitDate
        });
        setShowSuccessModal(true);
        clearPatient();
        if (formData.visitDate) { setActiveTab('future'); fetchFutureQueue(); } 
        else { setActiveTab('queue'); fetchQueue(); }
      } else {
        if (data.error && data.error.includes("already in the queue")) {
          setErrorModalData({
            title: "Patient Already Registered",
            message: data.error
          });
          setShowErrorModal(true);
        } else {
          alert("Registration failed: " + data.error);
        }
      }
    } catch (err) { alert("An error occurred"); } finally { setLoading(false); }
  };

  const toggleDoctorAvailability = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAvailable: !currentStatus })
      });
      const data = await res.json();
      if (data.success) fetchDoctors();
    } catch (err) {}
  };

  const handlePayBill = async () => {
    if (!selectedBill) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/billing/${selectedBill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowBillModal(false);
        fetchBills();
      }
    } catch (error) {
      alert("Billing update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Standardized Premium Format */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s', zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Reception Portal</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={20} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-fade-in">
        {/* Header */}
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', margin: 0, fontSize: '18px', fontWeight: '400' }}>Hospital Operations & Patient Lifecycle | Thoothukudi</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#E2E8F0', padding: '10px 25px', borderRadius: '50px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#0A4D68' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} | {shift} Shift
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '25px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B' }}>{userName}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>FRONT OFFICE EXECUTIVE</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68' }}>
                 {userName?.charAt(0) || 'R'}
              </div>
            </div>
          </div>
        </header>

        {/* KPI Row - DOCTOR PREMIUM STYLE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard 
            label="Token Activity" 
            value={queue.length} 
            icon={<Users size={22} />} 
            theme="blue"
            trend="+8%"
            onClick={() => { setStatsModalData({ title: 'Token Activity', list: queue }); setShowStatsModal(true); }} 
          />
          <StatCard 
            label="Future Bookings" 
            value={futureQueue.length} 
            icon={<CalendarCheck size={22} />} 
            theme="orange"
            trend="~4%"
            onClick={() => { setStatsModalData({ title: 'Future Bookings', list: futureQueue }); setShowStatsModal(true); }} 
          />
          <StatCard 
            label="In Consultation" 
            value={queue.filter(v => v.status === 'CONSULTING').length} 
            icon={<Activity size={22} />} 
            theme="green"
            onClick={() => { setStatsModalData({ title: 'In Consultation', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }} 
          />
          <StatCard 
            label="Docs On Duty" 
            value={doctors.filter(d => d.isAvailable !== false).length} 
            icon={<UserRoundCheck size={22} />} 
            theme="teal"
            onClick={() => { setStatsModalData({ title: 'Doctors On Duty', list: doctors.filter(d => d.isAvailable !== false) }); setShowStatsModal(true); }} 
          />
        </div>

        {/* Dynamic Content */}
        <div className="animate-fade-in">
          {activeTab === 'register' && (
            <div className="glass-card !p-10 !border-2 !border-white shadow-xl bg-white/70">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Patient Encounter Info</h2>
                <div className="relative w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={20} />
                  <input 
                    type="text" className="form-input !pl-12 !h-12 !bg-slate-50 border-none group-focus-within:!bg-white group-focus-within:!ring-2" 
                    placeholder="Search UHID / Phone / Name..." value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 300)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b last:border-0" onMouseDown={() => selectPatient(p)}>
                            <div className="font-bold text-slate-800">{p.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">{p.uhid}</span></div>
                            <div className="text-xs text-slate-500 mt-1">{p.phone} | {p.age}Y | {p.gender}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                   <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-200">
                         {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedPatient.name}</h4>
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Linked Record</span>
                         </div>
                         <div className="text-xs font-bold text-emerald-700/60 mt-2 flex gap-4">
                            <span><b>UHID:</b> {selectedPatient.uhid}</span>
                            <span><b>PHONE:</b> {selectedPatient.phone}</span>
                            <span><b>AGE:</b> {selectedPatient.age}Y</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="btn btn-outline h-11 px-5 border-emerald-600 text-emerald-600 bg-white" onClick={() => fetchHistory(selectedPatient.id)}><History size={16} className="mr-2" /> Medical History</button>
                      <button className="btn h-11 w-11 !p-0 bg-rose-100 text-rose-600 border-none" onClick={clearPatient}><Trash2 size={18} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="form-group">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Patient Full Name</label>
                  <input type="text" className="form-input !bg-slate-50 !h-14 font-bold border-none" placeholder="Enter name as per Aadhaar" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mobile Number <span className={formData.phone.length === 10 ? 'text-emerald-500' : 'text-rose-500'}>({formData.phone.length}/10)</span></label>
                  <input type="tel" className="form-input !bg-slate-50 !h-14 font-bold border-none" placeholder="Patient contact" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Age</label>
                    <input type="number" className="form-input !bg-slate-50 !h-14 font-bold border-none" placeholder="Years" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Gender</label>
                    <select className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Consulting Specialist</label>
                  <select className="form-input !bg-slate-50 !h-14 font-bold border-none" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    <option value="">Choose Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name.startsWith('Dr') ? d.name : `Dr. ${d.name}`} {d.specialization ? `(${d.specialization})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Appointment Date (Optional)</label>
                   <input type="date" className="form-input !bg-slate-50 !h-14 font-bold border-none" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group animate-in slide-in-from-right-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">TimeSlot</label>
                    <div className="flex gap-2">
                       <input 
                         type="time" 
                         className="form-input !bg-slate-50 !h-14 font-bold border-none flex-1" 
                         required 
                         value={formData.visitTime} 
                         onChange={e => setFormData({...formData, visitTime: e.target.value})} 
                       />
                       <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, timeSession: 'AM'})}
                            className={`px-4 rounded-lg font-black text-[10px] transition-all ${formData.timeSession === 'AM' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >AM</button>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, timeSession: 'PM'})}
                            className={`px-4 rounded-lg font-black text-[10px] transition-all ${formData.timeSession === 'PM' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >PM</button>
                       </div>
                    </div>
                  </div>
                )}
                <div className="form-group">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ABHA ID (Optional)</label>
                   <input type="text" className="form-input !bg-slate-50 !h-14 font-bold border-none" placeholder="14-digit ABHA" value={formData.abhaId} onChange={e => setFormData({...formData, abhaId: e.target.value})} />
                </div>
                <div className="form-group flex justify-start items-center">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" className="w-6 h-6 rounded-md border-emerald-500 text-emerald-500 focus:ring-emerald-500 bg-slate-50" checked={formData.consentGranted} onChange={e => setFormData({...formData, consentGranted: e.target.checked})} />
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-tight mt-1">Patient explicit consent granted<br/>for records data processing</span>
                   </label>
                </div>
                <div className="form-group md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Residential Address</label>
                  <textarea className="form-input !bg-slate-50 !h-20 font-bold border-none py-4" placeholder="Full address for system records..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" disabled={loading} className="btn btn-primary !h-16 !px-12 !rounded-2xl shadow-xl shadow-primary/20 text-lg font-black tracking-tight">{loading ? 'Processing Transaction...' : 'Generate Clinical Token'}</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800">Operational OPD Queue</h2>
                <div className="flex items-center gap-6">
                  <div style={{ background: '#F8FAFC', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#0A4D68', border: '1px solid #E2E8F0' }}>
                    Active Queue List
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#0A4D68', border: '1px solid #E2E8F0' }}>
                    Total {queue.length} Patients
                  </div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-left">
                    <th className="pb-4 pl-4">Identification</th>
                    <th className="pb-4">Demographics</th>
                    <th className="pb-4">Lifecycle Status</th>
                    <th className="pb-4">Assigned Consultant</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length > 0 ? queue.map((v) => (
                    <tr key={v.id} className="group hover-scale-101 transition-all">
                      <td className="p-4 bg-slate-50 rounded-l-2xl border-y border-l border-slate-100">
                        <div className="font-black text-primary text-base">#{v.tokenNumber}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">{v.patient.uhid}</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="font-bold text-slate-800">{v.patient.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{v.patient.age}Y | {v.patient.gender}</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${v.status === 'CONSULTING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {v.status === 'CONSULTING' ? 'Consultation' : 'Waiting'}
                        </span>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-black">DR</div>
                           <span className="text-xs font-bold text-slate-600">Dr. {v.doctor?.name.replace(/^(dr\.?\s*)+/i, '') || 'Consultant'}</span>
                        </div>
                      </td>
                      <td className="p-4 bg-slate-50 rounded-r-2xl border-y border-r border-slate-100 text-right">
                         <button className="btn btn-outline h-9 px-4 text-[10px]" onClick={() => fetchHistory(v.patientId)}>History</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-300">No active traffic in current shift.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'future' && (
            <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800">Advanced Appointments</h2>
                <div style={{ background: '#F8FAFC', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', color: '#0A4D68' }}>Total {futureQueue.length} Bookings</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-left">
                    <th className="pb-4 pl-4">Date & Time</th>
                    <th className="pb-4">Patient Narrative</th>
                    <th className="pb-4">Scheduled Consultant</th>
                    <th className="pb-4 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {futureQueue.length > 0 ? futureQueue.map((v) => (
                    <tr key={v.id} className="group hover-scale-101 transition-all">
                      <td className="p-4 bg-slate-50 rounded-l-2xl border-y border-l border-slate-100">
                        <div className="font-black text-slate-800 text-sm">{new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-[10px] font-bold text-primary mt-0.5">{v.visitTime || 'TBD'}</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="font-bold text-slate-800">{v.patient.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{v.chiefComplaints || 'General Checkup'}</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="text-xs font-bold text-slate-600">Dr. {v.doctor?.name.replace(/^(dr\.?\s*)+/i, '') || 'Consultant'}</div>
                      </td>
                      <td className="p-4 bg-slate-50 rounded-r-2xl border-y border-r border-slate-100 text-right">
                         <button className="btn btn-primary h-9 px-4 text-[10px] !bg-emerald-500 !shadow-none" onClick={() => {
                            const msg = `Reminder: Appointment for ${v.patient.name} on ${new Date(v.visitDate).toLocaleDateString()} with Dr. ${v.doctor.name} at Malar Hospital.`;
                            window.open(`https://web.whatsapp.com/send?phone=91${v.patient.phone}&text=${encodeURIComponent(msg)}`, '_blank');
                         }}>Remind</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-20 text-center font-bold text-slate-300">No future appointments scheduled.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card !p-8 animate-fade-in bg-white border-2 border-white">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800">Financial Clearance Center</h2>
                <div style={{ background: '#F8FAFC', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', color: '#0A4D68' }}>Total {bills.length} Records</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-left">
                    <th className="pb-4 pl-4">Invoice Subject</th>
                    <th className="pb-4">Classification</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Net Amount</th>
                    <th className="pb-4 pr-4 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? bills.map((b) => (
                    <tr key={b.id} className="group hover-scale-101 transition-all">
                      <td className="p-4 bg-slate-50 rounded-l-2xl border-y border-l border-slate-100">
                        <div className="font-bold text-slate-800">{b.visit.patient.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">UHID: {b.visit.patient.uhid}</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{b.type}</span>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                           {b.paymentStatus}
                         </span>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100 font-black text-primary">₹{b.finalAmount}</td>
                      <td className="p-4 bg-slate-50 rounded-r-2xl border-y border-r border-slate-100 text-right">
                         <div className="flex justify-end gap-2">
                            {b.paymentStatus === 'UNPAID' ? (
                               <button className="btn btn-primary h-9 px-4 text-[10px]" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>Collect</button>
                            ) : (
                               <button className="btn btn-outline h-9 px-4 text-[10px]" onClick={() => window.open(`/dashboard/reception/receipt/${b.id}`, '_blank')}>Print</button>
                            )}
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-300">No financial records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {doctors.map(doc => (
                <div key={doc.id} className="glass-card !p-8 bg-white border-2 border-white hover-scale-102 transition-all">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary text-2xl font-black">
                         {doc.name.charAt(0)}
                      </div>
                      <button 
                        onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)}
                        className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                      >
                         {doc.isAvailable !== false ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                      </button>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">{doc.name.startsWith('Dr') ? doc.name : `Dr. ${doc.name}`}</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2 tracking-widest uppercase">{doc.specialization || 'Clinical Specialist'}</p>
                   <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-50">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-300 uppercase letter-spacing-1">Current Status</span>
                         <span className={`text-[11px] font-black mt-0.5 ${doc.isAvailable !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {doc.isAvailable !== false ? 'ONSITE & ACTIVE' : 'OFFLINE'}
                         </span>
                      </div>
                      <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{doc.role}</span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '120px 20px 20px 20px' }}>
            <div className="glass-card !p-12 !max-w-md bg-white border-2 border-white text-center animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                  <CheckCircle2 size={40} />
               </div>
               <h2 className={`text-3xl font-black mb-4 ${successInfo?.title.includes('New') ? 'text-emerald-600' : 'text-primary'}`}>
                 {successInfo?.title.includes('New') ? "New Patient Registered!" : "Returning Patient Detected"}
               </h2>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                 {successInfo?.title.includes('New') 
                   ? `Permanent ID created for ${formData.name}.` 
                   : `Existing record found for ${formData.name}. New clinical token generated.`}
               </p>
               
               <div className="bg-slate-50 rounded-2xl p-8 mb-10 border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">OPD Clinical Token</div>
                  <div className="text-5xl font-black text-primary">#{successInfo?.token}</div>
                  {successInfo?.uhid && (
                    <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Universal Hospital ID (UHID)</div>
                       <div className="text-2xl font-black text-slate-800">{successInfo.uhid}</div>
                       {!successInfo?.title.includes('New') && <div className="text-[9px] font-black text-emerald-600 uppercase mt-2">Verified Existing Record</div>}
                    </div>
                  )}
               </div>

               <button className="btn btn-primary w-full h-16 !rounded-2xl text-lg font-black" onClick={() => setShowSuccessModal(false)}>Proceed to Next Registration</button>
            </div>
          </div>
        )}

        {/* History Modal - IMAGE 2 PERFECT ADMIN STYLE */}
        {showHistoryModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.4)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '100px 20px 20px 20px' }} onClick={() => setShowHistoryModal(false)}>
            <div className="glass-card !max-w-4xl !w-full !max-h-[85vh] bg-white border-none overflow-hidden flex flex-col animate-in zoom-in-95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem]" onClick={e => e.stopPropagation()}>
               {!historyData ? (
                 <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching clinical archive...</div>
                 </div>
               ) : (
                 <>
               {/* Modal Close - FORCED TOP RIGHT */}
               <button 
                 onClick={() => setShowHistoryModal(false)} 
                 style={{ position: 'absolute', top: '30px', right: '30px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', zIndex: 1000, padding: 0 }}
               >
                 <X size={28} />
               </button>

               {/* Premium Header */}
               <div style={{ padding: '40px 40px 30px 40px', position: 'relative', borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                     <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0A4D68 0%, #088395 100%)', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', boxShadow: '0 12px 20px -5px rgba(10, 77, 104, 0.3)' }}>
                        {historyData.patient.name.charAt(0)}
                     </div>
                     <div style={{ flex: 1, paddingRight: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '6px', flexWrap: 'wrap' }}>
                           <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0A4D68', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{historyData.patient.name}</h2>
                           <span style={{ background: '#ecfdf5', color: '#059669', padding: '5px 14px', borderRadius: '50px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', border: '1px solid rgba(5, 150, 105, 0.2)' }}>Active Patient</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '900', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1.5px' }}>UHID</span>
                              <span style={{ fontSize: '16px', fontWeight: '900', color: '#475569' }}>{historyData.patient.uhid}</span>
                           </div>
                           <div style={{ fontSize: '16px', fontWeight: '700', color: '#94a3b8' }}>{historyData.patient.age}Y • {historyData.patient.gender}</div>
                           <div style={{ fontSize: '16px', fontWeight: '900', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Phone size={16} fill="currentColor" /> {historyData.patient.phone}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Stats Bar - FORCED SPACING & NO OVERLAP */}
               <div style={{ padding: '25px 40px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#0A4D68', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 15px -3px rgba(10, 77, 104, 0.2)' }}><Clock size={20} /></div>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>Total Care Visits</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#0A4D68' }}>{historyData.history.length} Clinical Records</span>
                     </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                     <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '3px' }}>Latest Consultation</span>
                     <span style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{historyData.history[0] ? new Date(historyData.history[0].visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
               </div>
               
               {/* Clinical Archive List */}
               <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]/50 flex flex-col gap-6 custom-scrollbar" style={{ backdropFilter: 'blur(10px)' }}>
                 {historyData.history.length > 0 ? historyData.history.map((v, idx) => (
                    <div 
                      key={v.id} 
                      style={{ 
                        background: 'white', 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        border: '1px solid #f1f5f9', 
                        boxShadow: expandedVisitId === v.id ? '0 20px 40px -12px rgba(10, 77, 104, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                       <button 
                         onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}
                         style={{ 
                           width: '100%', 
                           padding: '35px 40px', 
                           display: 'flex', 
                           justifyContent: 'space-between', 
                           alignItems: 'center', 
                           textAlign: 'left', 
                           background: 'transparent', 
                           border: 'none', 
                           cursor: 'pointer',
                           outline: 'none'
                         }}
                       >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                             <div style={{ 
                               width: '64px', 
                               height: '64px', 
                               borderRadius: '50%', 
                               background: '#f8fafc',
                               color: '#94a3b8',
                               display: 'flex', 
                               flexDirection: 'column', 
                               alignItems: 'center', 
                               justifyContent: 'center',
                               transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                               flexShrink: 0,
                               aspectRatio: '1/1',
                               border: '1px solid #f1f5f9'
                             }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px' }}>Visit</span>
                                <span style={{ fontSize: '22px', fontWeight: '900', lineHeight: '1' }}>{historyData.history.length - idx}</span>
                             </div>
                             <div>
                                <div style={{ fontSize: '22px', fontWeight: '600', color: '#0A4D68', marginBottom: '8px', letterSpacing: '-0.5px' }}>{new Date(v.visitDate).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                   <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Token #{v.tokenNumber}</span>
                                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 10px rgba(5, 150, 105, 0.3)' }}></div>
                                </div>
                             </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '120px' }}>
                             <div style={{ textAlign: 'right', paddingLeft: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#0A4D68', justifyContent: 'flex-end' }}>
                                   <Stethoscope size={22} />
                                   <span style={{ fontSize: '18px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      {v.doctor?.name ? (v.doctor.name.toLowerCase().startsWith('dr') ? v.doctor.name : `Dr. ${v.doctor.name}`) : 'Specialist'}
                                   </span>
                                </div>
                             </div>
                             <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f8fafc', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease', transform: expandedVisitId === v.id ? 'rotate(180deg)' : 'rotate(0deg)', border: 'none' }}>
                                <ChevronDown size={28} />
                             </div>
                          </div>
                       </button>

                       {expandedVisitId === v.id && (
                          <div style={{ padding: '0 30px 30px 30px', animation: 'fadeIn 0.3s ease' }}>
                             <div style={{ paddingTop: '30px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clipboard size={16} /></div>
                                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Chief Complaints</span>
                                   </div>
                                   <p style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: 0, lineHeight: '1.6' }}>{v.chiefComplaints || 'General checkup'}</p>
                                </div>
                                <div style={{ background: '#fdf4ff', padding: '24px', borderRadius: '20px', border: '1px solid #f3e8ff' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16} /></div>
                                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Encounter Diagnosis</span>
                                   </div>
                                   <p style={{ fontSize: '14px', fontWeight: '700', color: '#334155', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>{v.diagnosis || 'Clinical evaluation in progress'}</p>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                  )) : (
                    <div style={{ padding: '80px 0', textAlign: 'center' }}>
                       <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#cbd5e1' }}><FileSearch size={40} /></div>
                       <div style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '3px' }}>No clinical records available</div>
                    </div>
                  )}
               </div>
               </>
               )}
            </div>
          </div>
        )}

        {/* Error / Conflict Modal - CENTERED */}
        {showErrorModal && errorModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-10 !max-w-md bg-white border-2 border-white text-center animate-in zoom-in-95 shadow-2xl overflow-hidden flex flex-col">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                  <AlertCircle size={32} />
               </div>
               <div className="overflow-y-auto max-h-[40vh] mb-8 px-2">
                  <h2 className="text-2xl font-black text-slate-800 mb-2">{errorModalData.title}</h2>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    {errorModalData.message}
                  </p>
               </div>
               <button className="btn btn-primary w-full h-14 !rounded-xl !bg-amber-600 border-none font-black text-lg shadow-lg shadow-amber-200 shrink-0" onClick={() => setShowErrorModal(false)}>Acknowledge & Continue</button>
            </div>
          </div>
        )}

        {/* Bill Modal */}
        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '120px 20px 20px 20px' }}>
            <div className="glass-card !p-10 !max-w-md bg-white border-2 border-white animate-in zoom-in-95">
               <h2 className="text-2xl font-black text-slate-800 mb-2">Payment Collection</h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Ref: {selectedBill.visit.patient.name} | ₹{selectedBill.finalAmount}</p>
               
               <div className="flex flex-col gap-6">
                  <div className="form-group">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Instrument</label>
                     <select className="form-input !h-12 font-bold" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}>
                        <option>CASH</option>
                        <option>UPI / QR</option>
                        <option>CARD</option>
                        <option>INSURANCE</option>
                     </select>
                  </div>
                  <div className="form-group">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Discount / Waiver (₹)</label>
                     <input type="number" className="form-input !h-12 font-bold" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} />
                  </div>
                  <button className="btn btn-primary w-full h-14 !rounded-xl font-black text-lg" onClick={handlePayBill} disabled={loading}>Confirm Receipt of ₹{selectedBill.finalAmount - (billingForm.discount || 0)}</button>
                  <button className="btn btn-outline w-full h-14 !rounded-xl border-none text-slate-400" onClick={() => setShowBillModal(false)}>Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* Stats Modal - COMPACT CENTERED */}
        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '120px 20px 20px 20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card !p-0 overflow-hidden bg-white animate-in zoom-in-95 rounded-[1.5rem]" style={{ width: '450px', maxWidth: '90vw', maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{statsModalData.title}</h3>
                <button onClick={() => setShowStatsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border-none"><X size={16} /></button>
              </div>
              <div className="p-4 overflow-y-auto">
                {statsModalData.list.length === 0 ? (
                  <div className="py-12 text-center text-xs font-black text-slate-300 uppercase tracking-widest italic">Empty Track</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {statsModalData.list.map((v: any) => (
                      <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                        <div>
                          <div className="font-black text-slate-800 uppercase text-xs">{v.patient?.name || v.name || 'RECORD'}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{v.uhid || v.patient?.uhid}</div>
                        </div>
                        <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                          {v.status || 'ACTIVE'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.3s' }}
    >
      <div style={{ opacity: active ? 1 : 0.4 }}>{icon}</div>
      <span style={{ fontWeight: active ? '800' : '400', fontSize: '15px', letterSpacing: active ? '0.5px' : '0' }}>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, theme, trend, onClick }: any) {
  const themes: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    teal: { bg: 'bg-cyan-50', text: 'text-cyan-700' }
  };
  const currentTheme = themes[theme] || themes.blue;

  return (
    <div className="glass-card !p-7 hover-scale-102 transition-all bg-white border-2 border-white cursor-pointer active:scale-95 shadow-sm" onClick={onClick}>
       <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap');
       `}</style>
       <div className="flex justify-between items-start mb-5">
          <div className={`w-14 h-14 rounded-2xl ${currentTheme.bg} flex items-center justify-center ${currentTheme.text} shadow-sm group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {trend && (
            <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all">
              {trend}
            </div>
          )}
       </div>
       <div className="text-[10px] font-800 text-slate-400 uppercase tracking-[1.5px] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</div>
       <div className="text-4xl font-black text-slate-800 tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
    </div>
  );
}
