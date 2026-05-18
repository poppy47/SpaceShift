import { format } from 'date-fns';

export function generateMonthlyReportPDF(data) {
  const { revenue, occupancy, totalSeats, totalUsers, expiringSoon } = data;
  
  const printWindow = window.open('', '', 'width=800,height=600');
  
  const overallOccupancy = occupancy.length
    ? Math.round(occupancy.reduce((s, o) => s + o.percentage, 0) / occupancy.length)
    : 0;

  let occupancyRows = '';
  const colors = {
    'Morning': '#185FA5',
    'Evening': '#0F6E56',
    'Night': '#73726c',
    'Full Day': '#854F0B'
  };

  occupancy.forEach(o => {
    occupancyRows += `
      <div class="occupancy-item">
        <div class="occupancy-label">
          <span>${o.shift}</span>
          <span>${o.percentage}%</span>
        </div>
        <div class="occupancy-bar">
          <div class="occupancy-fill" style="width: ${o.percentage}%; background: ${colors[o.shift] || '#888'};"></div>
        </div>
      </div>
    `;
  });

  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>SpaceShift Monthly Report</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        background: white;
        padding: 40px;
        color: #1f2937;
      }
      .header {
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .logo-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .logo-section svg {
        width: 32px;
        height: 32px;
      }
      .logo-section h1 {
        font-size: 28px;
        font-weight: 700;
        color: #000;
      }
      .report-meta {
        font-size: 13px;
        color: #6b7280;
        margin-top: 10px;
      }
      .report-title {
        font-size: 24px;
        font-weight: 600;
        color: #000;
        margin-bottom: 5px;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 30px;
      }
      .metric-card {
        border: 1px solid #e5e7eb;
        padding: 15px;
        border-radius: 8px;
        background: #f9fafb;
      }
      .metric-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .metric-value {
        font-size: 24px;
        font-weight: 700;
        color: #000;
      }
      .metric-sub {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 5px;
      }
      
      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #000;
        margin-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 10px;
      }
      
      .occupancy-bars {
        space-y: 12px;
      }
      .occupancy-item {
        margin-bottom: 12px;
      }
      .occupancy-label {
        font-size: 12px;
        color: #374151;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
      }
      .occupancy-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }
      .occupancy-fill {
        height: 100%;
        border-radius: 4px;
      }
      
      .revenue-info {
        background: #f0fdf4;
        border: 1px solid #dcfce7;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      .revenue-label {
        font-size: 12px;
        color: #15803d;
        margin-bottom: 5px;
      }
      .revenue-value {
        font-size: 20px;
        font-weight: 700;
        color: #166534;
      }
      
      .stats-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .stats-table td {
        padding: 10px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
        color: #374151;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 11px;
        color: #9ca3af;
        text-align: center;
      }
      
      @media print {
        body {
          padding: 0;
        }
        .metrics-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo-section">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="14" height="20" fill="none" stroke="#000000" stroke-width="1.5" rx="1"/>
          <rect x="22" y="10" width="14" height="20" fill="none" stroke="#000000" stroke-width="1.5" rx="1"/>
          <line x1="22" y1="10" x2="22" y2="30" stroke="#000000" stroke-width="1.5"/>
          <line x1="11" y1="14" x2="19" y2="14" stroke="#000000" stroke-width="1"/>
          <line x1="11" y1="17" x2="19" y2="17" stroke="#000000" stroke-width="1"/>
          <line x1="11" y1="20" x2="19" y2="20" stroke="#000000" stroke-width="1"/>
          <line x1="11" y1="23" x2="17" y2="23" stroke="#000000" stroke-width="1"/>
          <path d="M 28 19 L 34 25 M 34 25 L 28 31 M 34 25 L 36 25" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1>SpaceShift</h1>
      </div>
      <div class="report-title">Monthly Report</div>
      <div class="report-meta">
        <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'hh:mm a')}</p>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Revenue This Month</div>
        <div class="metric-value">₹${((revenue?.totalAmount || 0) / 100).toLocaleString('en-IN')}</div>
        <div class="metric-sub">${revenue?.bookingCount || 0} paid bookings</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Seats</div>
        <div class="metric-value">${totalSeats}</div>
        <div class="metric-sub">active seats</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Enrolled Students</div>
        <div class="metric-value">${totalUsers}</div>
        <div class="metric-sub">active accounts</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Overall Occupancy</div>
        <div class="metric-value">${overallOccupancy}%</div>
        <div class="metric-sub">avg across shifts</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Revenue Summary</div>
      <div class="revenue-info">
        <div class="revenue-label">Total Revenue (This Month)</div>
        <div class="revenue-value">₹${((revenue?.totalAmount || 0) / 100).toLocaleString('en-IN')}</div>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
        Total of ${revenue?.bookingCount || 0} paid bookings processed this month.
      </p>
    </div>
    
    <div class="section">
      <div class="section-title">Occupancy by Shift</div>
      <div class="occupancy-bars">
        ${occupancyRows}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Key Metrics</div>
      <table class="stats-table">
        <tbody>
          <tr>
            <td><strong>Total Seats Available</strong></td>
            <td style="text-align: right;">${totalSeats}</td>
          </tr>
          <tr>
            <td><strong>Active Student Accounts</strong></td>
            <td style="text-align: right;">${totalUsers}</td>
          </tr>
          <tr>
            <td><strong>Average Occupancy Rate</strong></td>
            <td style="text-align: right;">${overallOccupancy}%</td>
          </tr>
          <tr>
            <td><strong>Bookings Expiring Soon</strong></td>
            <td style="text-align: right;">${expiringSoon?.count || 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>© 2024 SpaceShift. This is a confidential report. All rights reserved.</p>
      <p>For any questions, please contact support@spaceshift.com</p>
    </div>
  </body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
