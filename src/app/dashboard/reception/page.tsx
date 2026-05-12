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
  ChevronDown
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
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalData, setStatsModalData] = useState<{title: string, list: any[]}|null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string, token: string, uhid?: string, whatsappSent?: boolean}|null>(null);

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

  useEffect(() => {
    let h = parseInt(timeHour);
    if (timePeriod === 'PM' && h < 12) h += 12;
    if (timePeriod === 'AM' && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${timeMinute}`;
    setFormData(prev => ({ ...prev, visitTime: formattedTime }));
  }, [timeHour, timeMinute, timePeriod]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`/api/users?role=DOCTOR&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDoctors(data.users);
        if (data.users.length > 0 && !formData.doctorId) {
          setFormData(prev => ({ ...prev, doctorId: data.users[0].id }));
        }
      }
    } catch (err) {}
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
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const upcoming = data.visits.filter((v: any) => {
          const vDate = new Date(v.visitDate);
          return vDate >= tomorrow && v.status !== 'COMPLETED';
        });
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

  useEffect(() => {
    if (formData.phone.length === 10) fetchPatients(formData.phone);
    else if (formData.phone.length === 0) setSelectedPatient(null);
  }, [formData.phone]);

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
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      } else alert(`❌ Failed: ${data.error}`);
    } catch (err) {} finally { setLoading(false); }
  };

  const toggleDoctorAvailability = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAvailable: !currentStatus })
      });
      if ((await res.json()).success) fetchDoctors();
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
      if ((await res.json()).success) { setShowBillModal(false); fetchBills(); }
    } catch (error) {} finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - RESTORED PREMIUM DESIGN */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Malar Hospital</h2>
          <span style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '800', marginTop: '4px', display: 'block' }}>Reception Portal</span>
        </div>
        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <SidebarItem active={activeTab === 'register'} icon={<UserPlus size={20} />} label="New Patient" onClick={() => setActiveTab('register')} />
          <SidebarItem active={activeTab === 'queue'} icon={<Users size={20} />} label="Today's Queue" onClick={() => setActiveTab('queue')} />
          <SidebarItem active={activeTab === 'future'} icon={<CalendarCheck size={20} />} label="Appointments" onClick={() => setActiveTab('future')} />
          <SidebarItem active={activeTab === 'billing'} icon={<CreditCard size={20} />} label="Billing Center" onClick={() => setActiveTab('billing')} />
          <SidebarItem active={activeTab === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors List" onClick={() => setActiveTab('doctors')} />
        </nav>
        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><LogoutButton /></div>
      </aside>

      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-in fade-in duration-500">
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '40px', fontWeight: '900', color: '#0A4D68', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Reception Dashboard</h1>
            <p style={{ color: '#64748B', fontSize: '18px', fontWeight: '500' }}>Hospital Operations & Patient Lifecycle | Thoothukudi</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#E2E8F0', padding: '12px 28px', borderRadius: '50px', fontSize: '12px', fontWeight: '900', color: '#0A4D68', textTransform: 'uppercase', letterSpacing: '1px' }}>
               {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} • {shift} Shift
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid #E2E8F0', paddingLeft: '25px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '900', fontSize: '15px', color: '#1E293B' }}>{userName}</div>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>FRONT OFFICE EXECUTIVE</div>
              </div>
              <div style={{ width: '48px', height: '48px', background: '#0A4D68', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', boxShadow: '0 10px 20px rgba(10,77,104,0.1)' }}>{userName?.charAt(0)}</div>
            </div>
          </div>
        </header>

        {/* KPI Row - RESTORED PREMIUM GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', marginBottom: '50px' }}>
          <StatCard 
            icon={<Users size={24} />} 
            label="Active Queue" 
            value={queue.filter(v => v.status !== 'CONSULTING').length} 
            trend="-9% Today" 
            onClick={() => { setStatsModalData({ title: 'Active Queue (Waiting)', list: queue.filter(v => v.status !== 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Activity size={24} />} 
            label="Consulting Now" 
            value={queue.filter(v => v.status === 'CONSULTING').length} 
            onClick={() => { setStatsModalData({ title: 'Patients in Consultation', list: queue.filter(v => v.status === 'CONSULTING') }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Completed Today" 
            value={bills.length} 
            onClick={() => { setStatsModalData({ title: 'Visits Completed Today', list: bills }); setShowStatsModal(true); }}
          />
          <StatCard 
            icon={<Calendar size={24} />} 
            label="Appointments" 
            value={futureQueue.length} 
            color="amber" 
            onClick={() => { setStatsModalData({ title: 'Future Scheduled Bookings', list: futureQueue }); setShowStatsModal(true); }}
          />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'register' && (
            <div className="glass-card !p-10 !border-2 !border-white shadow-2xl bg-white/70 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Patient Encounter Info</h2>
                <div className="relative w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all" size={20} />
                  <input type="text" className="form-input !pl-12 !h-14 !bg-slate-50 border-none group-focus-within:!bg-white group-focus-within:!ring-2 group-focus-within:!ring-primary/20 transition-all font-bold" placeholder="Quick Search ID/Phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchPatients(e.target.value); }} onBlur={() => setTimeout(() => setShowSearchResults(false), 300)} onFocus={() => searchQuery && setShowSearchResults(true)} />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+12px)] left-0 right-0 z-[200] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                       {searchResults.map(p => (
                         <div key={p.id} className="p-5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors" onMouseDown={() => selectPatient(p)}>
                            <div className="font-black text-slate-800 text-base">{p.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">{p.uhid}</span></div>
                            <div className="text-xs text-slate-500 mt-1 font-bold">{p.phone} • {p.age}Y • {p.gender}</div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="mb-10 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex justify-between items-center animate-in zoom-in-95 shadow-lg shadow-emerald-500/5">
                   <div className="flex gap-6 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-emerald-200">
                         {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedPatient.name}</h4>
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Verified Record</span>
                         </div>
                         <div className="text-xs font-black text-emerald-700/60 mt-2 flex gap-6 uppercase tracking-wider">
                            <span><b>UHID:</b> {selectedPatient.uhid}</span>
                            <span><b>AGE:</b> {selectedPatient.age}Y</span>
                            <span><b>PHONE:</b> {selectedPatient.phone}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button className="btn btn-outline h-12 px-6 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-600 hover:text-white transition-all font-black" onClick={() => fetchHistory(selectedPatient.id)}><History size={18} className="mr-2" /> Medical History</button>
                      <button className="btn h-12 w-12 !p-0 bg-rose-100 text-rose-600 border-none hover:bg-rose-200 transition-all active:scale-90" onClick={clearPatient}><Trash2 size={20} /></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="form-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Patient Full Name</label>
                  <input type="text" className="form-input !bg-slate-50 !h-16 font-black border-none text-lg text-slate-800 focus:!bg-white" placeholder="ENTER NAME" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Contact Number</label>
                  <input type="tel" className="form-input !bg-slate-50 !h-16 font-black border-none text-lg text-slate-800 focus:!bg-white" placeholder="MOBILE NO" maxLength={10} required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className="form-group grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Age (Years)</label>
                    <input type="number" className="form-input !bg-slate-50 !h-16 font-black border-none text-lg focus:!bg-white" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Gender</label>
                    <select className="form-input !bg-slate-50 !h-16 font-black border-none text-lg focus:!bg-white" required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Assigned Doctor</label>
                  <select className="form-input !bg-slate-50 !h-16 font-black border-none text-lg focus:!bg-white" required value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    {doctors.map(d => <option key={d.id} value={d.id}>DR. {d.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Appointment Date (Optional)</label>
                   <input type="date" className="form-input !bg-slate-50 !h-16 font-black border-none text-lg focus:!bg-white" min={new Date().toISOString().split('T')[0]} value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
                </div>
                {formData.visitDate && (
                  <div className="form-group animate-in slide-in-from-right-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 block">Scheduled Time</label>
                    <div className="flex gap-4">
                      <select className="form-input !bg-white !h-16 font-black border-2 border-slate-100 rounded-2xl flex-1 text-center text-xl" value={timeHour} onChange={e => setTimeHour(e.target.value)}>{Array.from({length: 12}, (_, i) => (i+1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}</select>
                      <select className="form-input !bg-white !h-16 font-black border-2 border-slate-100 rounded-2xl flex-1 text-center text-xl" value={timeMinute} onChange={e => setTimeMinute(e.target.value)}>{['00','15','30','45'].map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <button type="button" onClick={() => setTimePeriod(timePeriod === 'AM' ? 'PM' : 'AM')} className="bg-primary text-white px-8 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">{timePeriod}</button>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end mt-4">
                  <button type="submit" disabled={loading} className="btn btn-primary !h-20 !px-16 !rounded-[2rem] shadow-2xl shadow-primary/30 text-xl font-black tracking-tight active:scale-95 transition-all">{loading ? 'STAGING RECORD...' : 'GENERATE CLINICAL TOKEN'}</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="glass-card !p-10 bg-white/70 backdrop-blur-xl border-2 border-white shadow-2xl animate-in fade-in">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Operational OPD Queue</h2>
                <div className="flex gap-4">
                  <div className="px-5 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Shift</div>
                  <div className="px-5 py-2 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">{queue.length} PATIENTS IN WAIT</div>
                </div>
              </div>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-left">
                    <th className="pb-6 pl-6">ID Token</th>
                    <th className="pb-6">Patient Demographics</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6">Specialist</th>
                    <th className="pb-6 pr-6 text-right">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(v => (
                    <tr key={v.id} className="group hover:bg-white/50 transition-colors">
                      <td className="py-6 pl-6 border-t border-slate-100 font-black text-primary text-xl">#{v.tokenNumber}</td>
                      <td className="py-6 border-t border-slate-100">
                        <div className="font-black text-slate-800 text-lg uppercase">{v.patient.name}</div>
                        <div className="text-[10px] font-black text-slate-400 tracking-widest mt-1">{v.patient.uhid} • {v.patient.age}Y | {v.patient.gender}</div>
                      </td>
                      <td className="py-6 border-t border-slate-100">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === 'CONSULTING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {v.status === 'CONSULTING' ? 'In Consultation' : 'Waiting in Queue'}
                        </span>
                      </td>
                      <td className="py-6 border-t border-slate-100 font-black text-slate-600 text-sm uppercase tracking-tight">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</td>
                      <td className="py-6 pr-6 border-t border-slate-100 text-right">
                        <button className="btn btn-outline !h-10 px-5 text-[10px] font-black tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95" onClick={() => fetchHistory(v.patientId)}>VIEW HISTORY</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="glass-card !p-10 bg-white/70 backdrop-blur-xl border-2 border-white shadow-2xl animate-in fade-in">
              <h2 className="text-3xl font-black text-slate-800 mb-12 tracking-tight uppercase">Financial Center</h2>
              <table className="w-full border-separate border-spacing-0">
                <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-left"><th className="pb-6 pl-6">Invoice Subject</th><th className="pb-6">Status</th><th className="pb-6">Net Amount</th><th className="pb-6 pr-6 text-right">Action</th></tr></thead>
                <tbody>{bills.map(b => (
                  <tr key={b.id} className="group hover:bg-white/50 transition-colors">
                    <td className="py-6 pl-6 border-t border-slate-100"><div className="font-black text-slate-800 text-lg uppercase">{b.visit.patient.name}</div><div className="text-[10px] font-black text-slate-400 tracking-widest mt-1">{b.visit.patient.uhid}</div></td>
                    <td className="py-6 border-t border-slate-100"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{b.paymentStatus}</span></td>
                    <td className="py-6 border-t border-slate-100 font-black text-primary text-xl">₹{b.finalAmount}</td>
                    <td className="py-6 pr-6 border-t border-slate-100 text-right">{b.paymentStatus === 'UNPAID' && <button className="btn btn-primary !h-11 px-8 text-[11px] font-black active:scale-95 shadow-lg shadow-primary/20" onClick={() => { setSelectedBill(b); setShowBillModal(true); }}>COLLECT CASH</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="grid grid-cols-3 gap-10 animate-in slide-in-from-bottom-6">{doctors.map(doc => (
              <div key={doc.id} className="glass-card !p-10 bg-white/70 backdrop-blur-xl border-2 border-white hover-scale-102 transition-all shadow-xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 text-primary flex items-center justify-center font-black text-3xl shadow-inner">{doc.name.charAt(0)}</div>
                  <button onClick={() => toggleDoctorAvailability(doc.id, doc.isAvailable !== false)} className={`h-12 w-12 rounded-2xl shadow-lg transition-all active:scale-90 flex items-center justify-center ${doc.isAvailable !== false ? 'bg-emerald-50 text-emerald-600 shadow-emerald-200/20' : 'bg-rose-50 text-rose-600 shadow-rose-200/20'}`}>{doc.isAvailable !== false ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}</button>
                </div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">DR. {doc.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mt-2">{doc.specialization || 'General Consultation'}</p>
              </div>
            ))}</div>
          )}
        </div>

        {/* Modals - ALL CENTERED & PREMIUM */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-12 !max-w-md bg-white text-center animate-in zoom-in-95 shadow-3xl border-2 border-white rounded-[3rem]">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-100"><CheckCircle2 size={48} /></div>
              <h2 className="text-3xl font-black mb-4 text-emerald-600 tracking-tight uppercase">{successInfo?.title}</h2>
              <p className="text-slate-500 font-bold text-lg mb-10 leading-snug">{successInfo?.message}</p>
              <div className="bg-slate-50 rounded-[2rem] p-10 mb-10 border border-slate-100 shadow-inner">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] mb-3">OPD Clinical Token</div>
                <div className="text-6xl font-black text-primary tracking-tighter">#{successInfo?.token}</div>
              </div>
              <button className="btn btn-primary w-full h-20 !rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all" onClick={() => setShowSuccessModal(false)}>CONTINUE</button>
            </div>
          </div>
        )}

        {showHistoryModal && historyData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }}>
            <div className="glass-card !max-w-[720px] w-full !p-0 overflow-hidden flex flex-col bg-white shadow-3xl animate-in slide-in-from-bottom-5 border-2 border-white rounded-[2.5rem]" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0A4D68] text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-900/20">{historyData.patient.name.charAt(0)}</div>
                  <div>
                    <div className="font-black text-slate-800 text-2xl tracking-tight uppercase">{historyData.patient.name}</div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mt-1">{historyData.patient.uhid} • {historyData.patient.age}Y • {historyData.patient.gender}</div>
                  </div>
                </div>
                <button onClick={() => { setShowHistoryModal(false); setExpandedVisitId(null); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-10 overflow-y-auto bg-white">
                {historyData.history.length === 0 ? <div className="py-20 text-center text-slate-400 font-black text-xl italic opacity-50 tracking-widest uppercase">No clinical records found</div> : historyData.history.map((v: any, idx: number) => (
                  <div key={v.id} className="border border-slate-100 rounded-[2rem] mb-6 overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <div className={`p-6 cursor-pointer flex justify-between items-center transition-all ${expandedVisitId === v.id ? 'bg-slate-50' : 'bg-white'}`} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                      <div className="flex items-center gap-6">
                        <span className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black shadow-lg shadow-primary/20">{historyData.history.length - idx}</span>
                        <div>
                          <div className="font-black text-slate-800 text-lg uppercase">{new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">DR. {v.doctor?.name.toUpperCase().replace(/^(DR\.?\s*)+/i, '')}</div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-300 transition-transform duration-300 ${expandedVisitId === v.id ? 'rotate-180' : ''}`} size={24} />
                    </div>
                    {expandedVisitId === v.id && (
                      <div className="p-8 bg-white border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
                        {v.diagnosis && (
                          <div className="mb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] block mb-2">Final Diagnosis</span>
                            <p className="text-base font-black text-primary uppercase tracking-tight">{v.diagnosis}</p>
                          </div>
                        )}
                        {v.prescriptions?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] block mb-3">Medications Dispensed</span>
                            <div className="flex flex-wrap gap-3">
                              {v.prescriptions.map((p: any) => <span key={p.id} className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">💊 {p.drugName}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStatsModal && statsModalData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowStatsModal(false)}>
            <div className="glass-card !max-w-[500px] w-full !p-0 overflow-hidden bg-white shadow-3xl animate-in zoom-in-95 border-2 border-white rounded-[2.5rem]" style={{ maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{statsModalData.title}</h3><button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button></div>
              <div className="p-6 overflow-y-auto">{statsModalData.list.length === 0 ? <div className="py-20 text-center text-slate-400 font-black italic uppercase tracking-widest opacity-50">Empty Audit Trail</div> : <div className="flex flex-col gap-3">{statsModalData.list.map((v: any) => (
                <div key={v.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
                  <div>
                    <div className="font-black text-slate-800 uppercase text-base">{v.patient?.name || v.patientName || 'ANONYMOUS'}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[1px] mt-0.5">{v.patient?.uhid || v.uhid} • TOKEN #{v.tokenNumber || 'XX'}</div>
                  </div>
                  <div className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{v.status || 'SCHEDULED'}</div>
                </div>
              ))}</div>}</div>
            </div>
          </div>
        )}

        {showBillModal && selectedBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 77, 104, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card !p-12 !max-w-md bg-white animate-in zoom-in-95 shadow-3xl border-2 border-white rounded-[3rem]">
              <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tight uppercase">Payment Collection</h2>
              <div className="flex flex-col gap-8">
                <div className="form-group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] block mb-3">Revenue Class</label><select className="form-input !h-16 font-black border-none !bg-slate-50 text-lg rounded-2xl" value={billingForm.paymentMode} onChange={e => setBillingForm({...billingForm, paymentMode: e.target.value})}><option>CASH ON COUNTER</option><option>UPI / QR SCAN</option><option>CARD SWIPE</option></select></div>
                <div className="form-group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] block mb-3">Authorized Waiver</label><input type="number" className="form-input !h-16 font-black border-none !bg-slate-50 text-lg rounded-2xl" value={billingForm.discount} onChange={e => setBillingForm({...billingForm, discount: parseInt(e.target.value) || 0})} /></div>
                <button className="btn btn-primary w-full h-20 !rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 active:scale-95 transition-all" onClick={handlePayBill} disabled={loading}>CONFIRM RECEIPT ₹{selectedBill.finalAmount - billingForm.discount}</button>
                <button className="text-slate-400 font-black uppercase text-xs tracking-widest w-full mt-2 hover:text-rose-500 transition-colors" onClick={() => setShowBillModal(false)}>Cancel Transaction</button>
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
    <button onClick={onClick} style={{ width: '100%', padding: '18px 35px', display: 'flex', alignItems: 'center', gap: '18px', background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)', userSelect: 'none', borderLeft: active ? '4px solid white' : '4px solid transparent' }} className="active:scale-95 group">
      <div style={{ opacity: active ? 1 : 0.4, transition: '0.2s' }} className="group-hover:scale-110 transition-transform">{icon}</div>
      <span style={{ fontWeight: active ? '900' : '500', fontSize: '15px', letterSpacing: active ? '0.8px' : '0.2px', textTransform: 'uppercase', color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, trend, color, onClick }: { icon: any, label: string, value: number, trend?: string, color?: string, onClick?: () => void }) {
  return (
    <div style={{ padding: '30px', borderRadius: '32px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '2px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', position: 'relative', cursor: 'pointer', transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', gap: '20px' }} className="active:scale-95 hover:shadow-2xl hover:-translate-y-1 group" onClick={onClick}>
      {trend && <div style={{ position: 'absolute', top: '25px', right: '30px', fontSize: '9px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><TrendingUp size={12}/> {trend}</div>}
      <div style={{ width: '56px', height: '56px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color === 'amber' ? '#FFFBEB' : '#F1F5F9', color: color === 'amber' ? '#D97706' : '#0A4D68', transition: '0.3s' }} className="group-hover:scale-110 group-hover:rotate-6 shadow-sm">{icon}</div>
      <div>
        <div style={{ fontSize: '10px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '38px', fontWeight: '900', color: '#1E293B', letterSpacing: '-1.5px', lineHeight: '1' }}>{value}</div>
      </div>
    </div>
  );
}
