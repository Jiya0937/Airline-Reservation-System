import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

let transporter = null;
let testAccount = null;

// Initialize the Nodemailer transporter
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`Using custom SMTP configuration: ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    console.log('No SMTP config found in environment. Generating a test SMTP account via Ethereal...');
    try {
      testAccount = await nodemailer.createTestAccount();
      console.log(`Ethereal Test Account generated: ${testAccount.user}`);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.error('Failed to create Ethereal SMTP test account. Falling back to log-only transport.', err);
      // Fallback log transport
      transporter = {
        sendMail: async (options) => {
          console.log('--- MOCK EMAIL SENT ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Body: ${options.html}`);
          console.log('------------------------');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }

  return transporter;
}

/**
 * Sends a booking confirmation email
 * @param {Object} booking 
 */
export async function sendBookingConfirmation(booking) {
  try {
    const tx = await getTransporter();
    
    // Format travel date to a readable format
    const formatTravelDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = date.getDate().toString().padStart(2, '0');
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formattedDate = formatTravelDate(booking.travelDate);

    // HTML Content for the email matching FlyEasy design language
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FlyEasy Booking Confirmed</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0B1120;
      color: #F3F4F6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0B1120;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1E293B;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 1px;
    }
    .header p {
      margin: 5px 0 0;
      color: #38BDF8;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #FFFFFF;
    }
    .intro {
      font-size: 15px;
      line-height: 1.6;
      color: #9CA3AF;
      margin-bottom: 30px;
    }
    .summary-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #38BDF8;
      margin-bottom: 15px;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 8px;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .summary-table td {
      padding: 12px 0;
      border-bottom: 1px solid #1E293B;
      font-size: 14px;
      vertical-align: middle;
    }
    .summary-table td.label {
      color: #9CA3AF;
      font-weight: 600;
      width: 40%;
    }
    .summary-table td.value {
      color: #FFFFFF;
      font-weight: 700;
      text-align: right;
    }
    .summary-table td.value.pnr {
      color: #38BDF8;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 10px;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      margin: 0 10px 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
    }
    .btn-primary {
      background-color: #38BDF8;
      color: #0B1120;
    }
    .btn-outline {
      border: 1px solid #38BDF8;
      color: #38BDF8;
    }
    .footer {
      background-color: #030712;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #1E293B;
      font-size: 12px;
      color: #6B7280;
      line-height: 1.5;
    }
    .footer a {
      color: #38BDF8;
      text-decoration: none;
    }
    .contact-info {
      margin-top: 15px;
      font-weight: 600;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FlyEasy</h1>
        <p>Booking Confirmed</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${booking.passengerName},</div>
        <div class="intro">
          Thank you for choosing FlyEasy. Your booking has been confirmed successfully. Below you will find your itinerary and booking confirmation details.
        </div>
        
        <div class="summary-title">Booking Summary</div>
        <table class="summary-table">
          <tr>
            <td class="label">Booking ID</td>
            <td class="value">FLY${booking.bookingId}</td>
          </tr>
          <tr>
            <td class="label">PNR Number</td>
            <td class="value pnr">${booking.pnr}</td>
          </tr>
          <tr>
            <td class="label">Flight</td>
            <td class="value">${booking.flightNumber} (${booking.airline || 'FlyEasy Airways'})</td>
          </tr>
          <tr>
            <td class="label">Route</td>
            <td class="value">${booking.departure} &rarr; ${booking.destination}</td>
          </tr>
          <tr>
            <td class="label">Departure Time</td>
            <td class="value">${booking.departureTime}</td>
          </tr>
          <tr>
            <td class="label">Arrival Time</td>
            <td class="value">${booking.arrivalTime}</td>
          </tr>
          <tr>
            <td class="label">Travel Date</td>
            <td class="value">${formattedDate}</td>
          </tr>
          <tr>
            <td class="label">Passenger</td>
            <td class="value">${booking.passengerName}</td>
          </tr>
          <tr>
            <td class="label">Seat Number</td>
            <td class="value">${booking.seatNumber}</td>
          </tr>
          <tr>
            <td class="label">Amount Paid</td>
            <td class="value">₹${booking.fare.toLocaleString('en-IN')}</td>
          </tr>
        </table>
        
        <div class="cta-container">
          <a href="http://localhost:5174/checkin.html" class="btn btn-primary" style="background-color: #38BDF8; color: #0B1120;">View Booking</a>
          <a href="http://localhost:5000${booking.ticketPdfPath || `/tickets/FlyEasy_BoardingPass_${booking.pnr}.pdf`}" class="btn btn-outline" style="border: 1px solid #38BDF8; color: #38BDF8;">Download Ticket</a>
        </div>
      </div>
      <div class="footer">
        <p>Need help? Contact our support team. Please do not reply directly to this email.</p>
        <div class="contact-info">
          Email: <a href="mailto:support@flyeasy.com">support@flyeasy.com</a> | Phone: +91 99999 99999
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const fromEmail = testAccount ? `FlyEasy Confirmation <${testAccount.user}>` : (process.env.SMTP_FROM || 'no-reply@flyeasy.com');
    const mailOptions = {
      from: fromEmail,
      to: booking.email,
      subject: `🎉 FlyEasy Booking Confirmed – Your E-Ticket is Ready`,
      html: htmlContent
    };

    // Attach PDF if it exists
    if (booking.ticketPdfPath) {
      const fileName = path.basename(booking.ticketPdfPath);
      // ticketPdfPath is like "/tickets/FlyEasy_BoardingPass_XYZ.pdf"
      // The physical folder is inside ../public/tickets
      const filePath = path.join(process.cwd(), 'public/tickets', fileName);
      if (fs.existsSync(filePath)) {
        mailOptions.attachments = [{
          filename: fileName,
          path: filePath
        }];
      }
    }

    const info = await tx.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    
    // Log preview link if we generated a test account
    if (testAccount) {
      const etherealUrl = nodemailer.getTestMessageUrl(info);
      console.log(`✉️ [Ethereal Email Preview Link]: ${etherealUrl}`);
      return { success: true, messageId: info.messageId, previewUrl: etherealUrl };
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    throw err;
  }
}
