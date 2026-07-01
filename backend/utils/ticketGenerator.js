import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Draw a vector barcode
 */
function drawBarcode(doc, x, y, width, height) {
  doc.save();
  let currentX = x;
  const endX = x + width;
  // A pattern of alternating lines and spaces
  const linePatterns = [2, 1, 3, 1, 1, 2, 4, 1, 2, 2, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2];
  let i = 0;
  doc.fillColor('#111827');
  while (currentX < endX) {
    const lineWidth = linePatterns[i % linePatterns.length];
    const space = linePatterns[(i + 1) % linePatterns.length];
    doc.rect(currentX, y, lineWidth, height).fill();
    currentX += lineWidth + space;
    i++;
  }
  doc.restore();
}

/**
 * Format date to a readable format, e.g., "05 July 2026"
 */
function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Generates the Boarding Pass PDF
 * @param {Object} booking 
 * @returns {Promise<string>} relative URL path to download the ticket
 */
export const generateTicketPDF = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Define path to save PDF
      const publicDir = path.join(__dirname, '../public');
      const ticketsDir = path.join(publicDir, 'tickets');
      
      if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir, { recursive: true });
      }
      
      const fileName = `FlyEasy_BoardingPass_${booking.pnr}.pdf`;
      const filePath = path.join(ticketsDir, fileName);
      
      // Create PDF document (A4 Landscape: 841.89 x 595.27)
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // --- Background Styling ---
      // Premium background gradient simulated via a subtle background overlay
      doc.rect(0, 0, 842, 596).fill('#F8FAFC');
      
      // Main Pass Rounded Card Border (Outer frame)
      const cardX = 35;
      const cardY = 45;
      const cardW = 772;
      const cardH = 490;
      const cornerRadius = 16;
      
      // Fill card background
      doc.roundedRect(cardX, cardY, cardW, cardH, cornerRadius).fill('#FFFFFF');
      // Draw card border
      doc.roundedRect(cardX, cardY, cardW, cardH, cornerRadius).lineWidth(1.5).stroke('#E2E8F0');
      
      // --- Header Banner (Deep Blue #0B1120) ---
      // We will draw a clipped header banner shape
      doc.save();
      // Clipping path for top rounded corners
      doc.path(`M ${cardX + cornerRadius} ${cardY} 
               L ${cardX + cardW - cornerRadius} ${cardY} 
               A ${cornerRadius} ${cornerRadius} 0 0 1 ${cardX + cardW} ${cardY + cornerRadius} 
               L ${cardX + cardW} ${cardY + 75} 
               L ${cardX} ${cardY + 75} 
               L ${cardX} ${cardY + cornerRadius} 
               A ${cornerRadius} ${cornerRadius} 0 0 1 ${cardX + cornerRadius} ${cardY} Z`)
         .clip();
      
      // Header Fill
      doc.rect(cardX, cardY, cardW, 75).fill('#0B1120');
      doc.restore();
      
      // --- Header Content ---
      // Logo (Paper Airplane)
      doc.save();
      doc.translate(55, 62);
      doc.scale(1.2);
      doc.path('M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z')
         .lineWidth(2)
         .lineJoin('round')
         .lineCap('round')
         .stroke('#38BDF8'); // Bright Sky Blue
      doc.restore();
      
      // Brand Name
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('FlyEasy Airways', 90, 68);
         
      // E-Ticket Subtitle
      doc.fillColor('#94A3B8')
         .font('Helvetica')
         .fontSize(10)
         .text('ELECTRONIC BOARDING PASS', 90, 92);
         
      // Right header text (Stub header)
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('BOARDING PASS', 585, 68);
      
      doc.fillColor('#38BDF8')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('STUB COPY', 585, 86);
      
      // --- Separator Line (Dotted Vertical Line) ---
      const stubX = 565;
      doc.save()
         .strokeColor('#CBD5E1')
         .lineWidth(1.5)
         .dash(4, { space: 4 })
         .moveTo(stubX, cardY + 75)
         .lineTo(stubX, cardY + cardH)
         .stroke();
      doc.restore();
      
      // --- Main Section Content (Left) ---
      const contentX = 55;
      
      // 1. Passenger Name & Flight
      doc.fillColor('#64748B').font('Helvetica').fontSize(8.5).text('PASSENGER NAME', contentX, 145);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(booking.passengerName.toUpperCase(), contentX, 158);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8.5).text('FLIGHT', contentX + 220, 145);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(booking.flightNumber.toUpperCase(), contentX + 220, 158);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8.5).text('SEAT', contentX + 340, 145);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(booking.seatNumber, contentX + 340, 158);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8.5).text('CABIN CLASS', contentX + 430, 145);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text((booking.cabinClass || 'Economy').toUpperCase(), contentX + 430, 158);
      
      // 2. From & To Routing Block (Highlight Card Style)
      const routeY = 195;
      doc.roundedRect(contentX, routeY, 480, 75, 8).fill('#F8FAFC');
      doc.roundedRect(contentX, routeY, 480, 75, 8).lineWidth(1).stroke('#E2E8F0');
      
      // Departure Node
      const depCode = booking.departure.match(/\(([^)]+)\)/)?.[1] || 'DEL';
      const depCity = booking.departure.split(' ')[0] || 'Delhi';
      doc.fillColor('#3B82F6').font('Helvetica-Bold').fontSize(20).text(depCode, contentX + 20, routeY + 15);
      doc.fillColor('#475569').font('Helvetica').fontSize(9).text(depCity, contentX + 20, routeY + 42);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.departureTime, contentX + 20, routeY + 54);
      
      // Connection Arrow & Icon
      doc.save();
      doc.translate(contentX + 215, routeY + 24);
      doc.scale(1.2);
      doc.path('M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z')
         .lineWidth(1.5)
         .stroke('#94A3B8');
      doc.restore();
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(contentX + 110, routeY + 38).lineTo(contentX + 200, routeY + 38).stroke();
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(contentX + 250, routeY + 38).lineTo(contentX + 370, routeY + 38).stroke();
      
      // Arrival Node
      const arrCode = booking.destination.match(/\(([^)]+)\)/)?.[1] || 'BOM';
      const arrCity = booking.destination.split(' ')[0] || 'Mumbai';
      doc.fillColor('#3B82F6').font('Helvetica-Bold').fontSize(20).text(arrCode, contentX + 390, routeY + 15);
      doc.fillColor('#475569').font('Helvetica').fontSize(9).text(arrCity, contentX + 390, routeY + 42);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.arrivalTime, contentX + 390, routeY + 54);
      
      // 3. Flight Details Grid (Departure Date, Gate, Terminal, Boarding Time)
      const gridY = 295;
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('TRAVEL DATE', contentX, gridY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(formatDateFull(booking.travelDate), contentX, gridY + 13);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('BOARDING TIME', contentX + 160, gridY);
      doc.fillColor('#EF4444').font('Helvetica-Bold').fontSize(12).text(booking.boardingTime, contentX + 160, gridY + 12);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('GATE', contentX + 280, gridY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.gate || 'B14', contentX + 280, gridY + 13);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('TERMINAL', contentX + 350, gridY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.terminal || '2', contentX + 350, gridY + 13);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('MEAL PREF', contentX + 430, gridY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text((booking.meal || 'Vegetarian').replace(' Meal', ''), contentX + 430, gridY + 13);
      
      // 4. Passenger Personal Info Subcard
      const infoY = 345;
      doc.roundedRect(contentX, infoY, 480, 85, 8).fill('#F8FAFC');
      doc.roundedRect(contentX, infoY, 480, 85, 8).lineWidth(1).stroke('#E2E8F0');
      
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8).text('PASSENGER DETAILS', contentX + 15, infoY + 10);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('GENDER', contentX + 15, infoY + 26);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(booking.gender || 'Male', contentX + 15, infoY + 36);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('DATE OF BIRTH', contentX + 90, infoY + 26);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(booking.dob || '2000-01-01', contentX + 90, infoY + 36);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('NATIONALITY', contentX + 190, infoY + 26);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(booking.nationality || 'Indian', contentX + 190, infoY + 36);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('PASSPORT NUMBER', contentX + 310, infoY + 26);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text(booking.passportNumber || 'N/A', contentX + 310, infoY + 36);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('EMAIL ADDRESS', contentX + 15, infoY + 54);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text(booking.email, contentX + 15, infoY + 64);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('MOBILE NUMBER', contentX + 220, infoY + 54);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text(booking.mobile, contentX + 220, infoY + 64);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(7.5).text('TRANSACTION ID', contentX + 350, infoY + 54);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text(booking.transactionId || 'TXN12345678', contentX + 350, infoY + 64);
      
      // 5. Main Section Barcode
      const barcodeY = 445;
      drawBarcode(doc, contentX, barcodeY, 320, 35);
      
      doc.fillColor('#475569')
         .font('Helvetica')
         .fontSize(8.5)
         .text(`PNR: ${booking.pnr}  |  BOOKING ID: ${booking.bookingId}  |  SEAT: ${booking.seatNumber}`, contentX + 10, barcodeY + 38);
         
      // Important Notice
      doc.fillColor('#EF4444')
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('GATE CLOSES 20 MINUTES BEFORE DEPARTURE  |  PLEASE BE ON TIME', contentX + 150, barcodeY - 12, { align: 'right', width: 330 });
      
      // --- Stub Section Content (Right) ---
      const stubContentX = stubX + 20;
      
      // 1. Passenger Details
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('PASSENGER', stubContentX, 145);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.passengerName.toUpperCase(), stubContentX, 156, { lineBreak: false });
      
      // 2. Flight & Seat
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('FLIGHT', stubContentX, 185);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.flightNumber.toUpperCase(), stubContentX, 196);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('SEAT', stubContentX + 100, 185);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(booking.seatNumber, stubContentX + 100, 196);
      
      // 3. Routing
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('ROUTE', stubContentX, 225);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(`${depCode} TO ${arrCode}`, stubContentX, 236);
      
      // 4. Date & Gate
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('DATE', stubContentX, 265);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(formatDateFull(booking.travelDate), stubContentX, 276);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('GATE / TML', stubContentX + 110, 265);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(`${booking.gate || 'B14'} / T${booking.terminal || '2'}`, stubContentX + 110, 276);
      
      // 5. Boarding Time & PNR
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('BOARDING TIME', stubContentX, 305);
      doc.fillColor('#EF4444').font('Helvetica-Bold').fontSize(11).text(booking.boardingTime, stubContentX, 316);
      
      doc.fillColor('#64748B').font('Helvetica').fontSize(8).text('PNR REF', stubContentX + 110, 305);
      doc.fillColor('#3B82F6').font('Helvetica-Bold').fontSize(11).text(booking.pnr, stubContentX + 110, 316);
      
      // 6. QR Code Generation and Embed
      const qrData = JSON.stringify({
        BookingID: booking.bookingId,
        PNR: booking.pnr,
        PassengerName: booking.passengerName,
        FlightNumber: booking.flightNumber
      });
      
      try {
        const qrBuffer = await QRCode.toBuffer(qrData, {
          width: 90,
          margin: 1,
          color: {
            dark: '#0B1120', // Dark navy
            light: '#FFFFFF'
          }
        });
        
        doc.image(qrBuffer, stubContentX, 360, { width: 90, height: 90 });
      } catch (qrErr) {
        console.error('QR Code generation failed in PDF:', qrErr);
        // Fallback placeholder rect
        doc.rect(stubContentX, 360, 90, 90).lineWidth(1).stroke('#CBD5E1');
        doc.fillColor('#EF4444').fontSize(8).text('QR CODE ERROR', stubContentX + 10, 400);
      }
      
      // Stub copy text vertical banner
      doc.fillColor('#94A3B8')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('GATE CLOSES 20 MIN BEFORE DEPARTURE', stubContentX + 100, 360, { width: 90, height: 90 });
         
      // Finish PDF
      doc.end();
      
      writeStream.on('finish', () => {
        // Return download URL (relative path from static served public directory)
        const downloadUrl = `/tickets/${fileName}`;
        resolve(downloadUrl);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};
