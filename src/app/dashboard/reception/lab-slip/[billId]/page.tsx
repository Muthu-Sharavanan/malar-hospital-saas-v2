'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LabSlipPrint() {
  const { billId } = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/bill-summary/${billId}`);
        const data = await res.json();
        if (data.success) setBill(data.bill);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [billId]);

  if (loading) return <div className="p-10">Loading Lab Slip...</div>;
  if (!bill) return <div className="p-10">Lab Slip Not Found</div>;

  return (
    <div className="print-container" style={{ maxWidth: '400px', margin: '20px auto', padding: '20px', background: 'white', border: '1px solid #ddd', fontFamily: 'monospace' }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>MALAR HOSPITAL</h2>
        <p style={{ margin: 0, fontSize: '10px' }}>12 Alagesapuram Main road Thoothukudi-628002</p>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>LABORATORY TOKEN</p>
        <p style={{ margin: '5px 0', borderBottom: '1px dashed #000' }}></p>
      </div>

      <div style={{ fontSize: '13px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
           <span>Token: <strong>{bill.visit.tokenNumber}</strong></span>
           <span>Date: {new Date(bill.createdAt).toLocaleDateString()}</span>
        </div>
        <div style={{ marginTop: '5px' }}>Patient: <strong>{bill.visit.patient.name}</strong></div>
        <div>Age/Sex: {bill.visit.patient.age}Y / {bill.visit.patient.gender[0]}</div>
        <div>Dr: {bill.visit.doctor.name}</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }}></div>
      
      <div style={{ fontSize: '13px' }}>
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>TESTS ORDERED:</p>
        <ul style={{ paddingLeft: '15px', margin: 0 }}>
          {bill.labOrders.map((l: any) => (
            <li key={l.id}>{l.testName}</li>
          ))}
        </ul>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>

      <div style={{ fontSize: '11px', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>Please proceed to Room No. 5</p>
        <p style={{ margin: 0 }}>Sample Collection Desk</p>
        <p style={{ fontWeight: 600, marginTop: '5px' }}>Malar Hospital - Laboratory Information System</p>
      </div>

      {/* Print Button - Hidden on Print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
      <div className="no-print" style={{ textAlign: 'center', marginTop: '30px' }}>
         <button 
           className="btn btn-primary" 
           onClick={() => window.print()}
           style={{ padding: '10px 20px', borderRadius: '5px' }}
         >
           Print Lab Slip
         </button>
      </div>
    </div>
  );
}
