'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  Pill, 
  ClipboardList, 
  PackageCheck, 
  Search, 
  Menu, 
  X, 
  Clock, 
  ChevronRight, 
  Printer,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  ArrowUpRight,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function PharmacyPortal() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/pharmacy');
      const data = await res.json();
      if (data.success) setPrescriptions(data.orders);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
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
    fetchPrescriptions();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const interval = setInterval(fetchPrescriptions, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  // Grouped prescriptions by Visit ID
  const grouped = prescriptions.reduce((acc: any, p: any) => {
    if (!acc[p.visitId]) acc[p.visitId] = { visit: p.visit, items: [] };
    acc[p.visitId].items.push(p);
    return acc;
  }, {});

  const handleDispense = async (visitId: string) => {
    const items = grouped[visitId].items;
    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visitId, 
          prescriptionIds: items.map((i: any) => i.id) 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedVisitId(null);
        fetchPrescriptions();
      }
    } catch (err) {
      alert("Dispensing failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredGrouped = Object.values(grouped).filter((g: any) => 
    g.visit?.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.visit?.patient?.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.visit?.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Standardized Premium Format */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s', zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Pharmacy Portal</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <button 
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <LayoutDashboard size={20} /> 
            <span style={{ fontWeight: '600' }}>Dispensing</span>
          </button>
          
          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <ClipboardList size={20} />
            <span>Inventory Management</span>
          </div>

          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <Printer size={20} />
            <span>Labels & Reports</span>
          </div>
        </nav>

        <div style={{ padding: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '240px', padding: '60px 80px' }} className="animate-fade-in">
        {/* Header - Standardized Premium Format */}
        <header style={{ marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>Pharmacy Services</h1>
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
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B', textTransform: 'uppercase' }}>{userName || 'Pharmacist'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>MALAR HOSPITAL</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                 {userName ? userName.charAt(0) : 'P'}
              </div>
            </div>
          </div>
        </header>

        {/* KPI Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard 
              label="Pending Fulfillment" 
              value={filteredGrouped.length} 
              icon={<ClipboardList style={{ color: '#0A4D68' }} />} 
              trend={15}
              isPositive={false}
              trendLabel="this shift"
          />
          <StatCard 
              label="Dispensed (Today)" 
              value={84} 
              icon={<PackageCheck style={{ color: '#10B981' }} />} 
              isPositive={true}
              trend={12}
          />
          <StatCard 
              label="Store Alerts" 
              value={3} 
              icon={<AlertCircle style={{ color: '#EF4444' }} />} 
          />
          <StatCard 
              label="Avg. Fulfillment" 
              value="9m" 
              icon={<Clock style={{ color: '#14B8A6' }} />} 
              isPositive={true}
              trend={4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending List Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-secondary" size={20} /> Awaiting Fulfillment
              </h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="form-input !pl-9 !py-1 !pr-4 !text-xs !rounded-full !bg-white shadow-soft"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {filteredGrouped.length > 0 ? filteredGrouped.map((g: any) => (
                <div 
                  key={g.visit.id} 
                  className={`glass-card !p-5 cursor-pointer group hover-scale-102 ${selectedVisitId === g.visit.id ? '!border-secondary !shadow-lg bg-secondary/5' : 'bg-white'}`}
                  onClick={() => setSelectedVisitId(g.visit.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Token #{g.visit?.tokenNumber}</span>
                      <h4 className="text-base font-bold text-slate-800 lg:text-lg">{g.visit?.patient?.name}</h4>
                    </div>
                    <div className={`p-2 rounded-lg ${selectedVisitId === g.visit.id ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-400'} transition-all`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge badge-primary">{g.items?.length} Medications</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.visit?.patient?.uhid}</span>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                     <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        Dr. {g.visit?.doctor?.name.replace(/^(dr\.?\s*)+/i, '')}
                     </span>
                     <span className="text-[10px] text-slate-400 font-medium italic">Ready to dispense</span>
                  </div>
                </div>
              )) : (
                <div className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/50 border-dashed border-2 border-slate-200 shadow-none">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-slate-300" size={32} />
                  </div>
                  <h4 className="text-slate-500 font-bold">No Active Orders</h4>
                  <p className="text-xs text-slate-400">Prescriptions from doctors will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Column */}
          <div className="lg:col-span-2">
            {selectedVisitId ? (
              <div className="glass-card !p-8 animate-fade-in bg-white h-full border-2 border-white shadow-lg">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                         <PackageCheck className="text-secondary" size={20} />
                      </div>
                      <span className="badge badge-success">Digital Prescription</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Dispensing Workflow</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 mb-1 tracking-widest uppercase">Patient Record</div>
                    <div className="text-xl font-bold text-slate-700">{grouped[selectedVisitId].visit?.patient?.name}</div>
                    <div className="flex items-center justify-end gap-2 text-xs font-bold text-secondary mt-1">
                       <Calendar size={12} /> {grouped[selectedVisitId].visit?.patient?.uhid}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prescribed Medications</h4>
                      <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">Total: {grouped[selectedVisitId].items.length} Items</span>
                   </div>
                   
                   <div className="grid gap-4">
                      {grouped[selectedVisitId].items.map((item: any) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm group hover-scale-102 transition-all">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                                    <Pill className="text-primary" size={20} />
                                 </div>
                                 <div style={{ textAlign: 'left' }}>
                                    <h5 className="font-extrabold text-[#1E293B] text-lg leading-none">{item.drugName}</h5>
                                    <span className="text-xs font-bold text-secondary">{item.instructions}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="badge badge-primary !bg-slate-100 !text-slate-600 !font-black !px-4 !py-1 text-sm">{item.dosage}</div>
                                 <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-1">Duration: {item.duration}</div>
                              </div>
                           </div>
                           <div className="pt-3 border-t border-dashed border-slate-100 flex items-center gap-2">
                              <PackageCheck size={14} className="text-success" />
                              <span className="text-[11px] font-bold text-slate-400 italic">Verify drug strength and expiry before hand-over.</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                      <AlertCircle className="text-accent" size={20} />
                      <p className="text-xs font-semibold text-slate-600 italic">
                        By clicking "Confirm Dispensing", you verify that all medications listed above have been physically handed over to the patient or their guardian.
                      </p>
                   </div>
                   
                   <div className="flex gap-4">
                      <button 
                        className="btn btn-outline flex-1 h-16 !rounded-2xl"
                        onClick={() => setSelectedVisitId(null)}
                      >
                         Discard Selection
                      </button>
                      <button 
                         className="btn btn-primary flex-[2] bg-primary hover:bg-primary-light h-16 shadow-lg !rounded-2xl" 
                         onClick={() => handleDispense(selectedVisitId)} 
                         disabled={loading}
                      >
                         {loading ? (
                           <span className="flex items-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Finalizing...
                           </span>
                         ) : (
                           <span className="flex items-center gap-2">
                             <CheckCircle size={22} /> Confirm & Mark as Dispensed
                           </span>
                         )}
                      </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center p-24 text-center bg-white h-full shadow-soft border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
                  <Pill className="text-primary opacity-20" size={60} />
                </div>
                <h2 className="text-slate-400 font-bold mb-2 uppercase tracking-wide">Fulfillment Center</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  Select a registered patient prescription to process medication dispensing and update the pharmacy inventory.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components
function StatCard({ label, value, icon, trend, isPositive, trendLabel = "vs yesterday" }: any) {
  return (
    <div className="glass-card hover-scale-102 transition-transform duration-300">
       <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm text-primary">
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
