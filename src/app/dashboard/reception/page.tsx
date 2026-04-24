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
  FileText
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string, token: string, uhid?: string, whatsappSent?: boolean}|null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{name: string, uhid: string}|null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '', phone: '', age: '', gender: 'Male', address: '', doctorId: '', patientId: '', visitDate: '', visitTime: '', reason: '', abhaId: '', consentGranted: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Time Picker State
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [timeHour, setTimeHour] = useState('10');
  const [timeMinute, setTimeMinute] = useState('00');

  // Sync custom time to visitTime (24h format)
  useEffect(() => {
    let h = parseInt(timeHour);
    if (timePeriod === 'PM' && h < 12) h += 12;
    if (timePeriod === 'AM' && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${timeMinute}`;
    setFormData(prev => ({ ...prev, visitTime: formattedTime }));
  }, [timeHour, timeMinute, timePeriod]);

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
      const res = await fetch(`/api/appointments?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        // Get start of today (midnight) to compare
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter: Any visit where the date is strictly after today's midnight
        const upcoming = data.visits.filter((v: any) => {
          const vDate = new Date(v.visitDate);
          return vDate >= today && v.status !== 'COMPLETED';
        });
        setFutureQueue(upcoming);
      }
    } catch (err) {
      console.error("Fetch future queue error", err);
    }
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

  const fetchHistory = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${patientId}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData({ patient: data.patient, history: data.history });
        setShowHistoryModal(true);
      }
    } catch (err) {} finally { setLoading(false); }
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
    if (formData.phone.length !== 10) {
      alert("❌ Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        const selectedDoc = doctors.find((d: any) => d.id === formData.doctorId);
        const docName = selectedDoc ? selectedDoc.name.replace(/^(dr\.?\s*)+/i, '') : 'Consultant';
        const formattedDate = new Date(formData.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        const appointmentTime = formData.visitTime ? ` at ${formData.visitTime}` : '';

        const realWaMessage = formData.visitDate 
          ? `*APPOINTMENT CONFIRMATION*\n\n*Name:* ${formData.name}\n*Age:* ${formData.age}Y\n*UHID:* ${data.uhid}\n*Date:* ${formattedDate}${appointmentTime}\n*Doctor:* Dr. ${docName}\n*Token:* #${data.visit.tokenNumber}${formData.reason ? `\n*Reason:* ${formData.reason}` : ''}`
          : `*VISIT CONFIRMATION*\n\n*Name:* ${formData.name}\n*Age:* ${formData.age}Y\n*UHID:* ${data.uhid}\n*Doctor:* Dr. ${docName}\n*Token:* #${data.visit.tokenNumber}\n*Status:* Confirmed for Today.${formData.reason ? `\n*Reason:* ${formData.reason}` : ''}`;

        if (formData.phone && formData.visitDate) {
          // In a real scenario, this would be a server-side trigger, but we open WA Web here.
        }

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
      } else if (res.status === 409) {
        setDuplicateInfo({ name: formData.name, uhid: data.uhid });
        setShowDuplicateModal(true);
      } else {
        alert("Registration failed: " + data.error);
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

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard label="Token Activity" value={queue.length} icon={<Users size={20} />} trend={8} isPositive={true} />
          <StatCard label="Future Bookings" value={futureQueue.length} icon={<CalendarCheck size={20} />} />
          <StatCard label="In Consultation" value={queue.filter(v => v.status === 'CONSULTING').length} icon={<Activity size={20} />} isPositive={true} />
          <StatCard label="Docs On Duty" value={doctors.filter(d => d.isAvailable !== false).length} icon={<UserRoundCheck size={20} />} isPositive={true} />
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
                  <div className="form-group md:col-span-1 animate-in slide-in-from-right-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Scheduled Time Slot</label>
                    <div className="flex gap-4 items-center">
                       <div className="flex-1 flex gap-3">
                          <select 
                            className="form-input !bg-white !h-14 font-bold border-2 border-slate-100 rounded-full flex-1 text-center text-lg focus:border-primary transition-all shadow-sm cursor-pointer"
                            value={timeHour} onChange={e => setTimeHour(e.target.value)}
                          >
                            {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <select 
                            className="form-input !bg-white !h-14 font-bold border-2 border-slate-100 rounded-full flex-1 text-center text-lg focus:border-primary transition-all shadow-sm cursor-pointer"
                            value={timeMinute} onChange={e => setTimeMinute(e.target.value)}
                          >
                            {['00', '15', '30', '45'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                       </div>
                       
                       <div className="flex bg-slate-100/80 p-2.5 rounded-full h-20 w-[400px] border-2 border-slate-200 mt-8 mb-8 ml-4 shadow-inner gap-4">
                          <button 
                            type="button"
                            onClick={() => setTimePeriod('AM')}
                            className={`flex-1 rounded-full text-base font-black transition-all duration-300 ${timePeriod === 'AM' ? 'bg-[#088395] text-white shadow-[0_12px_24px_rgba(8,131,149,0.5)] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                          >AM</button>
                          <button 
                            type="button"
                            onClick={() => setTimePeriod('PM')}
                            className={`flex-1 rounded-full text-base font-black transition-all duration-300 ${timePeriod === 'PM' ? 'bg-[#088395] text-white shadow-[0_12px_24px_rgba(8,131,149,0.5)] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                          >PM</button>
                       </div>
                    </div>
                  </div>
                )}
                {formData.visitDate && (
                  <div className="form-group md:col-span-2 animate-in slide-in-from-top-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Reason for Appointment (Included in Reminder)</label>
                    <textarea 
                      className="form-input !bg-white !h-24 font-bold border-2 border-slate-100 rounded-2xl py-4 focus:border-primary transition-all shadow-sm"
                      placeholder="e.g. Fever for 2 days, General Checkup, Follow-up..."
                      value={formData.reason} 
                      onChange={e => setFormData({...formData, reason: e.target.value.toUpperCase()})}
                    />
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
                    <th className="pb-4">Patient</th>
                    <th className="pb-4">Consultation Reason</th>
                    <th className="pb-4">Scheduled Consultant</th>
                    <th className="pb-4 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {futureQueue.length > 0 ? futureQueue.map((v) => (
                    <tr key={v.id} className="group hover-scale-101 transition-all">
                      <td className="p-4 bg-slate-50 rounded-l-2xl border-y border-l border-slate-100">
                        <div className="font-black text-slate-800 text-sm">{new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div className="text-[10px] font-bold text-primary mt-0.5">
                          {new Date(v.visitDate).getHours() === 0 && new Date(v.visitDate).getMinutes() === 0 
                            ? 'TBD' 
                            : new Date(v.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="font-bold text-slate-800">{v.patient.name}</div>
                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">{v.patient.uhid} • {v.patient.age}Y</div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                         <div className="max-w-[200px] truncate text-[11px] font-bold text-slate-500 italic bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100">
                            {v.chiefComplaints || 'General Consultation'}
                         </div>
                      </td>
                      <td className="p-4 bg-slate-50 border-y border-slate-100">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                           <Stethoscope size={10} />
                           Dr. {v.doctor?.name.replace(/^(dr\.?\s*)+/i, '') || 'Consultant'}
                        </div>
                      </td>
                      <td className="p-4 bg-slate-50 rounded-r-2xl border-y border-r border-slate-100 text-right">
                         <button className="btn btn-primary h-10 px-6 text-[10px] !bg-emerald-500 !shadow-lg shadow-emerald-200/50 !rounded-xl" onClick={() => {
                            const formattedDate = new Date(v.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                            const time = new Date(v.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                            const msg = `*REMAINDER - MALAR HOSPITAL*\n\nPatient: ${v.patient.name}\nDate: ${formattedDate}\nTime: ${time}\nDoctor: Dr. ${v.doctor?.name}\n${v.chiefComplaints ? `Reason: ${v.chiefComplaints}\n` : ''}\nWe look forward to seeing you.`;
                            window.open(`https://web.whatsapp.com/send?phone=91${v.patient.phone}&text=${encodeURIComponent(msg)}`, '_blank');
                         }}>Remind</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-300">No future appointments scheduled.</td></tr>
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
          <div className="modal-overlay">
            <div className="glass-card !p-12 !max-w-md bg-white border-2 border-white text-center animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                  <CheckCircle2 size={40} />
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-4">{successInfo?.title}</h2>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed">{successInfo?.message}</p>
               
               <div className="bg-slate-50 rounded-2xl p-8 mb-10 border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Clinical Token ID</div>
                  <div className="text-5xl font-black text-primary">#{successInfo?.token}</div>
                  {successInfo?.uhid && (
                    <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Hospital Universal ID (UHID)</div>
                       <div className="text-2xl font-black text-slate-800">{successInfo.uhid}</div>
                    </div>
                  )}
               </div>

               <button className="btn btn-primary w-full h-16 !rounded-2xl text-lg font-black" onClick={() => setShowSuccessModal(false)}>Proceed to Next Registration</button>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && historyData && (
          <div className="modal-overlay">
            <div className="glass-card !max-w-3xl !max-h-[85vh] bg-white border-2 border-white overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
               <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Digital Clinical Records</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{historyData.patient.name} | {historyData.patient.uhid}</p>
                  </div>
                  <button className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400" onClick={() => setShowHistoryModal(false)}><X size={20} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-slate-50/50">
                  {historyData.history.length > 0 ? historyData.history.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                       <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed border-slate-100">
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Visit Narrative</span>
                             <span className="text-lg font-black text-slate-800">{new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <div className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-black border border-primary/10">Dr. {v.doctor?.name || 'Consultant'}</div>
                       </div>
                       <div className="grid grid-cols-2 gap-8 text-xs font-medium">
                          <div className="flex flex-col gap-4">
                             <div>
                                <span className="block font-black text-slate-300 uppercase tracking-widest mb-1.5">Diagnosis</span>
                                <div className="text-sm font-bold text-slate-700">{v.diagnosis || 'Clinical evaluation pending'}</div>
                             </div>
                             <div>
                                <span className="block font-black text-slate-300 uppercase tracking-widest mb-1.5">Complaints</span>
                                <div className="text-sm font-bold text-slate-700">{v.chiefComplaints || 'Standard Checkup'}</div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-4">
                             {v.prescriptions?.length > 0 && (
                               <div>
                                  <span className="block font-black text-slate-300 uppercase tracking-widest mb-1.5">Medications</span>
                                  <div className="flex flex-wrap gap-2">
                                     {v.prescriptions.map((p:any) => <span key={p.id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black border border-emerald-100">{p.drugName} ({p.dosage})</span>)}
                                  </div>
                               </div>
                             )}
                             {v.labOrders?.length > 0 && (
                               <div>
                                  <span className="block font-black text-slate-300 uppercase tracking-widest mb-1.5">Diagnostic Orders</span>
                                  <div className="flex flex-wrap gap-2">
                                     {v.labOrders.map((l:any) => <span key={l.id} className="bg-primary/5 text-primary px-3 py-1 rounded-lg font-black border border-primary/10">{l.testName}</span>)}
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center font-bold text-slate-300">No medical history found for this UHID.</div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Bill Modal */}
        {showBillModal && selectedBill && (
          <div className="modal-overlay">
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

        {/* Duplicate Modal */}
        {showDuplicateModal && (
          <div className="modal-overlay">
            <div className="glass-card !p-12 bg-white border-2 border-white text-center animate-in zoom-in-95">
               <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertCircle size={40} />
               </div>
               <h2 className="text-2xl font-black text-slate-800 mb-4">Patient Integrity Conflict</h2>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed">The patient <strong>{duplicateInfo?.name}</strong> is already registered under UHID: <strong>{duplicateInfo?.uhid}</strong>.</p>
               <button className="btn btn-primary w-full h-14 !rounded-xl" onClick={() => setShowDuplicateModal(false)}>Acknowledge & Search</button>
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

function StatCard({ label, value, icon, trend, isPositive }: any) {
  return (
    <div className="glass-card !p-7 hover-scale-102 transition-all bg-white/80 !border-white">
       <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary shadow-tiny">
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isPositive ? '+' : '-'}{trend}%
            </div>
          )}
       </div>
       <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{label}</div>
       <div className="text-3xl font-black text-slate-800 tracking-tighter">{value}</div>
    </div>
  );
}
