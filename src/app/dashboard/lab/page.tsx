'use client';
import { useState, useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';
import { 
  FlaskConical, 
  Activity, 
  Search, 
  Menu, 
  X, 
  Clock, 
  ChevronRight, 
  FileText, 
  Beaker,
  CheckCircle2,
  AlertCircle,
  Bell,
  Calendar,
  ArrowUpRight,
  TrendingDown,
  LayoutDashboard
} from 'lucide-react';

export default function LaboratoryPortal() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/lab-report');
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error("Failed to fetch lab orders", err);
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
    fetchOrders();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const interval = setInterval(fetchOrders, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lab-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, reportData: reportText })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(null);
        setReportText('');
        fetchOrders();
      }
    } catch (err) {
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.visit?.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.visit?.patient?.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Sidebar - Standardized Premium Format */}
      <aside style={{ width: '240px', background: '#0A4D68', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, transition: 'all 0.3s', zIndex: 100 }}>
        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'white' }}>Malar Hospital</h2>
          <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', color: 'white' }}>Lab Portal</span>
        </div>

        <nav style={{ padding: '30px 0', flexGrow: 1 }}>
          <button 
             style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', transition: '0.2s', fontSize: '15px' }}
          >
            <LayoutDashboard size={20} /> 
            <span style={{ fontWeight: '600' }}>Lab Workspace</span>
          </button>
          
          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <FileText size={20} />
            <span>Report History</span>
          </div>

          <div style={{ width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.4, cursor: 'not-allowed' }}>
            <Beaker size={20} />
            <span>Inventory</span>
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
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0A4D68', margin: '0 0 10px 0' }}>Laboratory Services</h1>
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
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E293B', textTransform: 'uppercase' }}>{userName || 'Technician'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold' }}>MALAR HOSPITAL</div>
              </div>
              <div style={{ width: '45px', height: '45px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0A4D68', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                 {userName ? userName.charAt(0) : 'L'}
              </div>
            </div>
          </div>
        </header>

        {/* KPI Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard 
              label="Pending Tests" 
              value={filteredOrders.length} 
              icon={<FlaskConical style={{ color: '#0A4D68' }} />} 
              trend={12}
              isPositive={false}
              trendLabel="this shift"
          />
          <StatCard 
              label="Completed (Today)" 
              value={42} 
              icon={<CheckCircle2 style={{ color: '#10B981' }} />} 
              isPositive={true}
              trend={8}
          />
          <StatCard 
              label="Avg. Wait Time" 
              value="18m" 
              icon={<Clock style={{ color: '#F59E0B' }} />} 
          />
          <StatCard 
              label="Efficiency" 
              value="94%" 
              icon={<Activity style={{ color: '#14B8A6' }} />} 
              isPositive={true}
              trend={5}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-secondary" size={20} /> Pending Workspace
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
              {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                <div 
                  key={o.id} 
                  className={`glass-card !p-5 cursor-pointer group hover-scale-102 ${selectedOrder?.id === o.id ? '!border-secondary !shadow-lg bg-secondary/5' : 'bg-white'}`}
                  onClick={() => setSelectedOrder(o)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">#{o.id.slice(-6).toUpperCase()}</span>
                      <h4 className="text-base font-bold text-slate-800 lg:text-lg">{o.testName}</h4>
                    </div>
                    <div className={`p-2 rounded-lg ${selectedOrder?.id === o.id ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-400'} transition-all`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {o.visit?.patient?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700">{o.visit?.patient?.name}</div>
                      <div className="text-[10px] font-medium text-slate-400">Token #{o.visit?.tokenNumber} &nbsp;·&nbsp; {o.visit?.patient?.uhid}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="glass-card flex flex-col items-center justify-center p-12 text-center bg-white/50 border-dashed border-2 border-slate-200 shadow-none">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-slate-300" size={32} />
                  </div>
                  <h4 className="text-slate-500 font-bold">Queue is Clear</h4>
                  <p className="text-xs text-slate-400">Incoming tests will appear here in real-time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed View / Report Entry Column */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="glass-card !p-8 animate-fade-in bg-white h-full border-2 border-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-primary">Processing Entry</span>
                      <span className="text-xs font-bold text-slate-400 tracking-widest">{selectedOrder.testName.toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">Sample Analysis Results</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 mb-1 tracking-widest uppercase text-[10px]">Patient Identity</div>
                    <div className="text-lg font-bold text-slate-700">{selectedOrder.visit?.patient?.name}</div>
                    <div className="text-xs text-secondary font-bold">{selectedOrder.visit?.patient?.uhid}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Case Metadata</div>
                      <div className="flex flex-col gap-3">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Referring Consultant:</span>
                            <span className="font-bold text-primary">Dr. {selectedOrder.visit?.doctor?.name.replace(/^(dr\.?\s*)+/i, '')}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Sample Priority:</span>
                            <span className="font-bold text-accent">Routine</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Visit Context:</span>
                            <span className="font-bold text-slate-700">Token #{selectedOrder.visit?.tokenNumber}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Clinical Notes</div>
                      <div className="text-sm font-medium text-slate-600 line-clamp-3 italic">
                         {selectedOrder.visit?.chiefComplaints || "No specific complaints noted by consultant."}
                      </div>
                   </div>
                </div>
                
                <form onSubmit={handleSubmitReport} className="flex flex-col gap-6">
                  <div className="form-group mb-0">
                    <div className="flex justify-between items-center mb-3">
                      <label className="form-label !mb-0 text-base font-bold">Findings & Interpretations</label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Data Entry</span>
                    </div>
                    <textarea 
                      className="form-input !h-[300px] !p-6 !text-base focus:!ring-4" 
                      placeholder="Enter diagnostic findings here..." 
                      required 
                      value={reportText} 
                      onChange={e => setReportText(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      className="btn btn-outline flex-1 h-16 !rounded-2xl"
                      onClick={() => {
                        setSelectedOrder(null);
                        setReportText('');
                      }}
                    >
                      Discard Selection
                    </button>
                    <button type="submit" className="btn btn-primary flex-[2] bg-primary hover:bg-primary-light h-16 shadow-lg !rounded-2xl" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={22} /> Verify & Publish to Consultant
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center p-24 text-center bg-white h-full shadow-soft border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
                  <Activity className="text-primary opacity-20" size={60} />
                </div>
                <h2 className="text-slate-400 font-bold mb-2 uppercase tracking-wide">Analysis Center</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">
                  Select a pending laboratory order from the queue to enter diagnostic results and publish findings.
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


