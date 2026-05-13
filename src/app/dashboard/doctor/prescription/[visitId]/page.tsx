'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PrescriptionPrint() {
  const { visitId } = useParams();
  const searchParams = useSearchParams();
  const isPatientView = searchParams.get('view') === 'patient';
  const urlAdvice = searchParams.get('advice');
  const urlSigned = searchParams.get('signed') === 'true';

  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigned, setIsSigned] = useState(urlSigned);
  const [advice, setAdvice] = useState('');

  useEffect(() => {
    if (urlAdvice) setAdvice(urlAdvice);
  }, [urlAdvice]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/visit-summary/${visitId}`);
        const data = await res.json();
        if (data.success) setVisit(data.visit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [visitId]);

  if (loading) return <div className="p-10">Loading Prescription...</div>;
  if (!visit) return <div className="p-10">Prescription Not Found</div>;

  return (
    <div className="print-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 40px 40px 40px', background: 'white', minHeight: '100vh', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      {/* Hospital Header */}
      <div className="flex flex-col items-center mb-4 pb-2 text-center" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '-10px' }}>
           <img src="/logo.jpeg" alt="Malar Hospital" style={{ width: '280px', height: 'auto', display: 'block' }} />
        </div>
        
        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
           <p style={{ margin: '0' }}>12 Alagesapuram Main Road | Thoothukudi - 628002</p>
           <p style={{ margin: '0' }}>Tel: 0461 - 2360380</p>
        </div>

        <div style={{ width: '100%', borderBottom: '2px solid #0A4D68', paddingBottom: '4px', textAlign: 'center' }}>
           <h2 style={{ color: '#0A4D68', margin: 0, fontSize: '28px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>VISIT SUMMARY</h2>
        </div>
      </div>

      {/* Patient Info Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Patient Name</small>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>{visit.patient.name}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Age / Gender</small>
            <span style={{ fontWeight: 600 }}>{visit.patient.age}Y / {visit.patient.gender}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Date</small>
            <span style={{ fontWeight: 600 }}>{new Date(visit.createdAt).toLocaleDateString('en-GB')}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Time of Summary Generation</small>
            <span style={{ fontWeight: 600 }}>{new Date(visit.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>OP ID</small>
            <span style={{ fontWeight: 600 }}>{visit.patientId.slice(-6).toUpperCase()}</span>
         </div>
         <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Consultant</small>
            <span style={{ fontWeight: 600 }}>{visit.doctor.name.includes('Aravind') ? 'Dr.Aravind MD, DrNB(MGE)' : visit.doctor.name}</span>
         </div>
      </div>

      {/* Vitals Section */}
      <div className="mb-6">
        <h4 style={{ color: '#0A4D68', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Vitals</h4>
        <div className="flex gap-8">
           <div><small style={{ color: '#64748B' }}>BP: </small><span style={{ fontWeight: 600, fontSize: '13px' }}>{visit.bloodPressure}</span></div>
           <div><small style={{ color: '#64748B' }}>Pulse: </small><span style={{ fontWeight: 600, fontSize: '13px' }}>{visit.pulse}</span></div>
           <div><small style={{ color: '#64748B' }}>SpO₂: </small><span style={{ fontWeight: 600, fontSize: '13px' }}>{visit.spo2}%</span></div>
           <div><small style={{ color: '#64748B' }}>Temp: </small><span style={{ fontWeight: 600, fontSize: '13px' }}>{visit.temperature}°F</span></div>
           <div><small style={{ color: '#64748B' }}>BMI: </small><span style={{ fontWeight: 600, fontSize: '13px' }}>{visit.bmi}</span></div>
        </div>
      </div>

      {/* Consultation Findings */}
      <div className="mb-6">
        <h4 style={{ color: '#0A4D68', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Findings</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
           <div>
               <small style={{ fontWeight: 800, color: '#1E293B', display: 'block', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>Chief Complaints</small>
              <p style={{ margin: '4px 0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{visit.chiefComplaints || 'N/A'}</p>
           </div>
           {visit.history && (
             <div>
                 <small style={{ fontWeight: 800, color: '#1E293B', display: 'block', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>Clinical History</small>
                <p style={{ margin: '4px 0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{visit.history}</p>
             </div>
           )}
           {visit.examination && (
             <div>
                 <small style={{ fontWeight: 800, color: '#1E293B', display: 'block', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>Physical Examination</small>
                <p style={{ margin: '4px 0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{visit.examination}</p>
             </div>
           )}
           <div>
               <small style={{ fontWeight: 800, color: '#1E293B', display: 'block', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>Provisional Diagnosis</small>
              <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{visit.diagnosis || 'Clinical evaluation pending'}</p>
           </div>
           {visit.investigationAdvised && (
             <div>
                 <small style={{ fontWeight: 800, color: '#1E293B', display: 'block', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.5px' }}>Investigation Advised</small>
                <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'pre-wrap' }}>{visit.investigationAdvised}</p>
             </div>
           )}
        </div>
      </div>

      {/* Prescription (Rx) */}
      <div className="mb-8" style={{ minHeight: '250px' }}>
        <h3 style={{ borderBottom: '2px solid #0A4D68', display: 'inline-block', marginBottom: '15px', fontSize: '20px', color: '#0A4D68' }}>Rx</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase' }}>S.No</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase' }}>Medicine Name</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase' }}>Dosage</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase' }}>Duration</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: '11px', textTransform: 'uppercase' }}>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {visit.prescriptions?.map((p: any, i: number) => (
              <tr key={p.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>{i + 1}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{p.drugName}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>{p.dosage}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>{p.duration}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{p.instructions || '-'}</td>
              </tr>
            ))}
            {(!visit.prescriptions || visit.prescriptions.length === 0) && (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No medications prescribed.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Typing Orders Section */}
      <div className="mb-6" style={{ marginTop: '10px' }}>
        <h4 style={{ color: '#0A4D68', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Advice/Comments</h4>
        <div
          contentEditable={!isPatientView}
          suppressContentEditableWarning
          onInput={(e: any) => setAdvice(e.currentTarget.innerText)}
          className="typing-orders"
          style={{
            minHeight: '70px',
            border: isPatientView ? 'none' : '1px dashed #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: '2',
            outline: 'none',
            color: '#1e293b',
            whiteSpace: 'pre-wrap',
          }}
          data-placeholder={isPatientView ? '' : "e.g. Lifestyle advice given. Review on 23/5/26"}
        >
          {advice}
        </div>
      </div>

      {/* Suggested Investigations Area */}
      {visit.labOrders?.length > 0 && (
        <div className="mb-8">
            <h4 style={{ color: '#0A4D68', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>Investigations Ordered</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
              {visit.labOrders.map((l: any) => (
                <div key={l.id} style={{ fontSize: '12px', fontWeight: 600 }}>• {l.testName}</div>
              ))}
            </div>
        </div>
      )}

      {/* Follow-up / Review Section */}
      {visit.nextReview && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
           <small style={{ fontWeight: 'bold', color: '#0A4D68', display: 'block', textTransform: 'uppercase', fontSize: '10px', marginBottom: '5px' }}>Review / Follow-up Instructions</small>
           <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0A4D68', whiteSpace: 'pre-wrap' }}>{visit.nextReview}</p>
        </div>
      )}

      {/* Signature Area */}
      <div style={{ marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '20px' }}>
         {!isPatientView && (
           <div className="no-print" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="sign-check" 
                checked={isSigned} 
                onChange={(e) => setIsSigned(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="sign-check" style={{ fontSize: '13px', fontWeight: 600, color: '#0A4D68', cursor: 'pointer' }}>Digitally Sign Prescription</label>
           </div>
         )}

         <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '240px', paddingTop: '5px', position: 'relative' }}>
            {isSigned && (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '5px', pointerEvents: 'none' }}>
                 <img 
                    src="/signature.png" 
                    alt="Signature" 
                    style={{ 
                      width: '160px', 
                      height: 'auto', 
                      display: 'block', 
                      mixBlendMode: 'multiply',
                      filter: 'contrast(1.1)' 
                    }} 
                 />
              </div>
            )}
            <p style={{ fontWeight: 700, margin: 0, fontSize: '15px' }}>{visit.doctor.name.includes('Aravind') ? 'Dr.Aravind MD, DrNB(MGE)' : visit.doctor.name}</p>
            <small style={{ color: '#64748B', display: 'block', fontSize: '12px' }}>Reg No: {visit.doctor.name.includes('Aravind') ? 'TNMC No: 122757' : (visit.doctor.regNo || 'MC-12345')}</small>
         </div>
      </div>

      {/* Print & Share Buttons - Hidden on Print */}
      <style>{`
        @media print {
          @page { margin: 0; }
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          .print-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 10px 40px 40px 40px !important; }
          .typing-orders { border: none !important; padding-left: 0 !important; }
        }
        .typing-orders:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .typing-orders:focus { border-color: #0A4D68 !important; }
      `}</style>
      <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
         {visit.patient.phone && !isPatientView && (
           <button 
             className="btn btn-success" 
             onClick={() => {
               const phone = visit.patient.phone.replace(/\D/g, '');
               const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
               const shareUrl = `${window.location.origin}${window.location.pathname}?view=patient&advice=${encodeURIComponent(advice)}&signed=${isSigned}`;
               const message = `Hello ${visit.patient.name}, your prescription from Malar Hospital is ready. View it here: ${shareUrl}`;
               window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
             }}
             style={{ padding: '15px 25px', borderRadius: '50px', background: '#25D366', color: 'white', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
           >
             <i className="fa-brands fa-whatsapp" style={{ fontSize: '20px' }}></i> Share via WhatsApp
           </button>
         )}
         <button 
           className="btn btn-primary" 
           onClick={() => window.print()}
           style={{ padding: '15px 30px', borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
         >
           <i className="fa-solid fa-print"></i> Print Prescription
         </button>
      </div>
    </div>
  );
}
