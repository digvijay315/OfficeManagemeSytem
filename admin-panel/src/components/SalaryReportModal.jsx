import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, X } from 'lucide-react';

const SalaryReportModal = ({ reportData, month, onClose }) => {
  if (!reportData) return null;

  const { companyName, staff, summary, attendanceList, rewardsList, advancesList } = reportData;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(63, 81, 181); // indigo
    doc.text(companyName, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Official Salary & Attendance Report", pageWidth / 2, 28, { align: 'center' });
    doc.text(`Month: ${month}`, pageWidth / 2, 34, { align: 'center' });

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, pageWidth - 14, 40);

    // Staff Info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("STAFF INFORMATION", 14, 50);
    doc.text("SALARY DETAILS", pageWidth / 2 + 20, 50);

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(staff.name, 14, 56);
    doc.text(`Base Salary: Rs ${staff.baseSalary}`, pageWidth / 2 + 20, 56);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(staff.email, 14, 62);
    doc.text(`Daily Wage: Rs ${Math.round(staff.baseSalary / summary.daysInMonth)}`, pageWidth / 2 + 20, 62);

    let startY = 75;

    // Attendance Table
    doc.setFontSize(12);
    doc.setTextColor(63, 81, 181);
    doc.text("Day-by-Day Attendance", 14, startY);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Date', 'Status', 'Deduction']],
      body: attendanceList.map(a => [a.date, a.status, a.deduction > 0 ? `- Rs ${a.deduction}` : '-']),
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      margin: { left: 14, right: 14 }
    });

    startY = doc.lastAutoTable.finalY + 15;

    // Rewards
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`Rewards (${rewardsList.length})`, 14, startY);
    
    if (rewardsList.length > 0) {
      autoTable(doc, {
        startY: startY + 5,
        head: [['Date', 'Detail', 'Amount']],
        body: rewardsList.map(r => [new Date(r.date).toLocaleDateString(), r.description || 'Task Reward', `+ Rs ${r.amount}`]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 }
      });
      startY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No rewards this month.", 14, startY + 6);
      startY += 15;
    }

    // Advances
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 22); // orange
    doc.text(`Advances (${advancesList.length})`, 14, startY);

    if (advancesList.length > 0) {
      autoTable(doc, {
        startY: startY + 5,
        head: [['Date', 'Detail', 'Amount']],
        body: advancesList.map(a => [new Date(a.date).toLocaleDateString(), a.description || 'Advance', `- Rs ${a.amount}`]),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 14, right: 14 }
      });
      startY = doc.lastAutoTable.finalY + 20;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No advances taken this month.", 14, startY + 6);
      startY += 20;
    }

    // Add page if needed
    if (startY > doc.internal.pageSize.height - 70) {
      doc.addPage();
      startY = 20;
    }

    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(14, startY, pageWidth - 28, 65, 'FD');

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Final Payment Summary", 20, startY + 10);

    doc.setFontSize(11);
    doc.text(`Base Salary:`, 20, startY + 22);
    doc.text(`Rs ${staff.baseSalary}`, pageWidth - 20, startY + 22, { align: 'right' });

    doc.setTextColor(16, 185, 129);
    doc.text(`Total Rewards:`, 20, startY + 30);
    doc.text(`+ Rs ${summary.totalReward}`, pageWidth - 20, startY + 30, { align: 'right' });

    doc.setTextColor(239, 68, 68);
    doc.text(`Absent Deduction (${summary.absentDays} Days):`, 20, startY + 38);
    doc.text(`- Rs ${summary.deduction}`, pageWidth - 20, startY + 38, { align: 'right' });

    doc.setTextColor(249, 115, 22);
    doc.text(`Total Advance Taken:`, 20, startY + 46);
    doc.text(`- Rs ${summary.totalAdvance}`, pageWidth - 20, startY + 46, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, startY + 52, pageWidth - 20, startY + 52);

    doc.setFontSize(16);
    doc.setTextColor(63, 81, 181);
    doc.text(`Final Amount:`, 20, startY + 60);
    doc.text(`Rs ${summary.remainingSalary}`, pageWidth - 20, startY + 60, { align: 'right' });

    doc.save(`${staff.name}_Salary_Report_${month}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header Options */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-700">Salary Report Preview</h2>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition"
            >
              <Download size={18} /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400 transition"
            >
              <X size={18} /> Close
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-8 overflow-y-auto bg-gray-100 flex-1">
          {/* A4 Paper Container for Preview */}
          <div 
            className="bg-white p-10 shadow-sm mx-auto" 
            style={{ minHeight: '11in', width: '8.5in', color: '#333', fontFamily: 'Arial, sans-serif' }}
          >
            {/* Company Header */}
            <div className="text-center mb-8 border-b-2 border-indigo-600 pb-4">
              <h1 className="text-3xl font-bold text-indigo-700 tracking-wide uppercase">{companyName}</h1>
              <p className="text-gray-500 mt-1">Official Salary & Attendance Report</p>
              <p className="text-gray-500 font-semibold mt-1">Month: {month}</p>
            </div>

            {/* Staff Details */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-1">Staff Information</h3>
                <p className="font-bold text-lg">{staff.name}</p>
                <p className="text-gray-600">{staff.email}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-1">Salary Details</h3>
                <p className="text-gray-600">Base Salary: <span className="font-bold text-gray-800">₹{staff.baseSalary}</span></p>
                <p className="text-gray-600">Daily Wage: ₹{Math.round(staff.baseSalary / summary.daysInMonth)}</p>
              </div>
            </div>

            {/* Attendance Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 text-indigo-600">Day-by-Day Attendance</h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-2 w-1/3">Date</th>
                    <th className="border border-gray-200 p-2 w-1/3 text-center">Status</th>
                    <th className="border border-gray-200 p-2 w-1/3 text-right">Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((record, index) => (
                    <tr key={index} className={record.status === 'Absent' ? 'bg-red-50' : ''}>
                      <td className="border border-gray-200 p-2">{record.date}</td>
                      <td className={`border border-gray-200 p-2 text-center font-semibold ${record.status === 'Present' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {record.status}
                      </td>
                      <td className="border border-gray-200 p-2 text-right text-gray-600">
                        {record.deduction > 0 ? `- ₹${record.deduction}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rewards and Advances Side-by-Side */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Rewards */}
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 text-emerald-600">Rewards ({rewardsList.length})</h3>
                {rewardsList.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-2">Date</th>
                        <th className="border border-gray-200 p-2">Detail</th>
                        <th className="border border-gray-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewardsList.map((r, i) => (
                        <tr key={i}>
                          <td className="border border-gray-200 p-2">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="border border-gray-200 p-2 truncate max-w-[100px]">{r.description || 'Task Reward'}</td>
                          <td className="border border-gray-200 p-2 text-right font-medium text-emerald-600">+ ₹{r.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm italic">No rewards this month.</p>
                )}
              </div>

              {/* Advances */}
              <div>
                <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4 text-orange-500">Advances ({advancesList.length})</h3>
                {advancesList.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-2">Date</th>
                        <th className="border border-gray-200 p-2">Detail</th>
                        <th className="border border-gray-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancesList.map((a, i) => (
                        <tr key={i}>
                          <td className="border border-gray-200 p-2">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="border border-gray-200 p-2 truncate max-w-[100px]">{a.description || 'Advance'}</td>
                          <td className="border border-gray-200 p-2 text-right font-medium text-orange-600">- ₹{a.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm italic">No advances taken this month.</p>
                )}
              </div>
            </div>

            {/* Final Calculation Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-1/2 ml-auto">
              <h3 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-300 pb-2">Final Payment Summary</h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Base Salary:</span>
                <span className="font-semibold">₹{staff.baseSalary}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-emerald-600">Total Rewards:</span>
                <span className="font-semibold text-emerald-600">+ ₹{summary.totalReward}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-red-500">Absent Deduction ({summary.absentDays} Days):</span>
                <span className="font-semibold text-red-500">- ₹{summary.deduction}</span>
              </div>
              <div className="flex justify-between mb-4 border-b border-gray-200 pb-4">
                <span className="text-orange-500">Total Advance Taken:</span>
                <span className="font-semibold text-orange-500">- ₹{summary.totalAdvance}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold">
                <span className="text-gray-800">Final Amount:</span>
                <span className="text-indigo-700">₹{summary.remainingSalary}</span>
              </div>
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
              <p>This is a computer generated report and does not require a physical signature.</p>
              <p>Generated on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryReportModal;
