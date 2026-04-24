'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FinalBillPrint() {
  const { visitId } = useParams();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/consolidated-bill/${visitId}`);
        const data = await res.json();
        if (data.success) setVisit(data.visit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisit();
  }, [visitId]);

  if (loading) return <div className="p-10 text-center">Loading Final Bill...</div>;
  if (!visit) return <div className="p-10 text-center">Visit Not Found</div>;

  let totalCharges = 0;
  let totalDiscounts = 0;
  let totalPaid = 0;
  let totalRefunded = 0;

  visit.bills.forEach((b: any) => {
    totalCharges += b.amount;
    totalDiscounts += b.discount;
    if (b.paymentStatus === 'PAID') {
      totalPaid += b.finalAmount;
    } else if (b.paymentStatus === 'REFUNDED') {
      totalRefunded += b.refundAmount;
      // Net paid is total minus refunded
      totalPaid += (b.finalAmount - b.refundAmount);
    }
  });

  return (
    <div className="print-container" style={{ maxWidth: '800px', margin: '20px auto', padding: '40px', background: 'white', border: '1px solid #ddd', fontFamily: 'serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#0A4D68' }}>MALAR HOSPITAL</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>12 Alagesapuram Main road Thoothukudi-628002</p>
        <p style={{ margin: 0, fontSize: '14px' }}>Phone: 0461-231234, 230987</p>
        <div style={{ margin: '15px 0', borderBottom: '2px solid #0A4D68' }}></div>
        <h3 style={{ margin: 0, textDecoration: 'underline' }}>CONSOLIDATED VISIT SUMMARY</h3>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px', marginBottom: '30px' }}>
         <div>
            <p><strong>Patient Name:</strong> {visit.patient.name}</p>
            <p><strong>Patient ID / UHID:</strong> {visit.patient.uhid}</p>
            <p><strong>Age / Gender:</strong> {visit.patient.age}Y, {visit.patient.gender}</p>
            {visit.patient.address && <p><strong>Address:</strong> {visit.patient.address}</p>}
         </div>
         <div style={{ textAlign: 'right' }}>
            <p><strong>Visit ID:</strong> {visit.id.slice(-6).toUpperCase()}</p>
            <p><strong>Token No:</strong> #{visit.tokenNumber}</p>
            <p><strong>Visit Date:</strong> {new Date(visit.visitDate).toLocaleDateString()}</p>
            <p><strong>Primary Doctor:</strong> {visit.doctor.name}</p>
         </div>
      </div>

      {/* Bill Items */}
      <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Service Breakdown</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '14px' }}>
         <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #000' }}>
               <th style={{ textAlign: 'left', padding: '10px' }}>Service Type</th>
               <th style={{ textAlign: 'left', padding: '10px' }}>Details / Items</th>
               <th style={{ textAlign: 'center', padding: '10px' }}>Status</th>
               <th style={{ textAlign: 'right', padding: '10px' }}>Gross Amt (₹)</th>
            </tr>
         </thead>
         <tbody>
            {visit.bills.map((b: any, index: number) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                 <td style={{ padding: '10px' }}>{b.type}</td>
                 <td style={{ padding: '10px' }}>
                    {b.type === 'LAB' && b.labOrders.map((o:any)=>o.testName).join(', ')}
                    {b.type === 'SURGERY' && b.surgeryItemization && (
                       <div style={{ fontSize: '12px' }}>
                         {JSON.parse(b.surgeryItemization).map((i: any, idx: number) => (
                           <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                             <span>- {i.itemName}</span>
                             <span>₹{i.amount.toFixed(2)}</span>
                           </div>
                         ))}
                       </div>
                    )}
                    {b.type === 'CONSULTATION' && 'OPD Consultation'}
                    {b.discount > 0 ? <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>Discount applied: -₹{b.discount} ({b.waiverReason})</div> : null}
                    {b.paymentStatus === 'REFUNDED' && <div style={{ fontSize: '12px', color: '#dc2626' }}>Refunded: -₹{b.refundAmount} ({b.refundReason})</div>}
                 </td>
                 <td style={{ textAlign: 'center', padding: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: b.paymentStatus === 'PAID' ? 'green' : b.paymentStatus === 'REFUNDED' ? 'orange' : 'red' }}>
                       {b.paymentStatus}
                    </span>
                 </td>
                 <td style={{ textAlign: 'right', padding: '10px' }}>{b.amount.toFixed(2)}</td>
              </tr>
            ))}
         </tbody>
      </table>

      {/* Summary Box */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
         <div style={{ width: '300px', background: '#f8fafc', padding: '15px', borderRadius: '5px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
               <span>Total Gross Charges:</span>
               <span>₹{totalCharges.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#dc2626' }}>
               <span>Total Discounts:</span>
               <span>- ₹{totalDiscounts.toFixed(2)}</span>
            </div>
            {totalRefunded > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#dc2626' }}>
                 <span>Total Refunded:</span>
                 <span>- ₹{totalRefunded.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #000', fontWeight: 'bold', fontSize: '18px' }}>
               <span>Net Paid:</span>
               <span>₹{totalPaid.toFixed(2)}</span>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
         <div style={{ fontSize: '12px' }}>
            <p><em>*This is a computer generated consolidated bill.</em></p>
            <p><em>*Any unpaid services are subject to clearance before discharge/exit.</em></p>
         </div>
         <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>Authorized Signatory</p>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
      <div className="no-print" style={{ textAlign: 'center', marginTop: '30px' }}>
         <button className="btn btn-primary" onClick={() => window.print()}>Print Consolidated Bill</button>
      </div>
    </div>
  );
}
