const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function generateCertificate(donation, res) {
  // Portrait A4
  const doc = new PDFDocument({
    layout: 'portrait',
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=EnVision-Certificate-${donation._id}.pdf`);

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  // ── Outer decorative border ──
  doc.lineWidth(3)
     .rect(20, 20, pageWidth - 40, pageHeight - 40)
     .stroke('#001f3f'); // Dark Blue

  // ── Inner decorative border ──
  doc.lineWidth(1)
     .rect(30, 30, pageWidth - 60, pageHeight - 60)
     .stroke('#c5a059'); // Gold

  // ── Logo ──
  const logoPath = path.join(__dirname, '../assets/logo.jpg');
  if (fs.existsSync(logoPath)) {
    // Logo width is 160, so x = centerX - 80
    doc.image(logoPath, centerX - 80, 50, { width: 160 });
  }

  // ── Header ──
  doc.fontSize(48)
     .font('Times-Bold')
     .fillColor('#001f3f')
     .text('CERTIFICATE', 0, 180, { align: 'center', characterSpacing: 4 });

  // "OF" with lines
  doc.fontSize(16)
     .font('Times-Roman')
     .fillColor('#c5a059')
     .text('OF', 0, 240, { align: 'center', characterSpacing: 2 });
     
  const ofWidth = doc.widthOfString('O F'); 
  doc.moveTo(centerX - 100, 248)
     .lineTo(centerX - ofWidth/2 - 10, 248)
     .lineWidth(1)
     .stroke('#c5a059');
  doc.moveTo(centerX + ofWidth/2 + 10, 248)
     .lineTo(centerX + 100, 248)
     .lineWidth(1)
     .stroke('#c5a059');

  doc.fontSize(24)
     .font('Times-Roman')
     .fillColor('#001f3f')
     .text('APPRECIATION', 0, 270, { align: 'center', characterSpacing: 6 });

  // ── Presented to text ──
  doc.fontSize(16)
     .font('Times-Roman')
     .fillColor('#333333')
     .text('This certificate is proudly presented to', 0, 330, { align: 'center' });

  // ── Donor Name ──
  const name = donation.donorName ? donation.donorName.toUpperCase() : 'PIYUSH';
  doc.fontSize(46)
     .font('Times-Bold')
     .fillColor('#b8860b')
     .text(name, 0, 360, { align: 'center' });

  // ── Diamond separator ──
  doc.save();
  doc.fillColor('#c5a059');
  doc.translate(centerX, 430);
  doc.rotate(45);
  doc.rect(-4, -4, 8, 8).fill();
  doc.restore();

  // ── Appreciation text ──
  doc.fontSize(14)
     .font('Times-Roman')
     .fillColor('#444444')
     .text(
       'In profound recognition of your outstanding contribution and unwavering commitment to the EnVision Foundation. Your generosity and selfless dedication play a pivotal role in our mission of "Learning Beyond Books", enabling us to educate, empower, and nurture the hidden creativity of underprivileged children. We deeply value your invaluable support in driving meaningful change.',
       80, 470, { width: pageWidth - 160, align: 'center', lineGap: 8 }
     );

  // ── Awarded on ──
  const dateY = doc.y + 35;
  doc.moveTo(centerX - 50, dateY + 8)
     .lineTo(centerX - 100, dateY + 8)
     .lineWidth(1)
     .stroke('#c5a059');
  
  doc.moveTo(centerX + 50, dateY + 8)
     .lineTo(centerX + 100, dateY + 8)
     .lineWidth(1)
     .stroke('#c5a059');

  doc.fontSize(12)
     .font('Times-Roman')
     .fillColor('#555555')
     .text('Awarded on', 0, dateY, { align: 'center' });

  const dateStr = new Date(donation.date || new Date()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  doc.fontSize(15)
     .font('Times-Bold')
     .fillColor('#b8860b')
     .text(dateStr, 0, dateY + 20, { align: 'center' });

  // ── Signature section ──
  const sigY = 670;

  // Left signature (President)
  doc.moveTo(80, sigY)
     .lineTo(240, sigY)
     .lineWidth(1)
     .stroke('#333333');

  doc.fontSize(13)
     .font('Times-Bold')
     .fillColor('#333333')
     .text('President', 80, sigY + 8, { width: 160, align: 'center' });

  doc.fontSize(11)
     .font('Times-Roman')
     .fillColor('#555555')
     .text('EnVision Foundation', 80, sigY + 24, { width: 160, align: 'center' });

  // Right signature
  doc.moveTo(pageWidth - 240, sigY)
     .lineTo(pageWidth - 80, sigY)
     .lineWidth(1)
     .stroke('#333333');

  doc.fontSize(13)
     .font('Times-Bold')
     .fillColor('#333333')
     .text('Authorized Signatory', pageWidth - 240, sigY + 8, { width: 160, align: 'center' });

  doc.fontSize(11)
     .font('Times-Roman')
     .fillColor('#555555')
     .text('EnVision Foundation', pageWidth - 240, sigY + 24, { width: 160, align: 'center' });

  // ── Footer quote ──
  const quoteY = 740;
  
  doc.moveTo(centerX - 170, quoteY)
     .lineTo(centerX - 170, quoteY + 35)
     .lineWidth(2)
     .stroke('#c5a059');

  doc.fontSize(12)
     .font('Times-Italic')
     .fillColor('#555555')
     .text('"The best way to find yourself is to lose yourself', centerX - 155, quoteY, { width: 310, align: 'center' })
     .text('in the service of others."', { align: 'center' });
     
  doc.fontSize(11)
     .font('Times-Roman')
     .text('— Mahatma Gandhi', centerX - 155, doc.y + 5, { width: 310, align: 'center' });

  // ── Developer Credits ──
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#777777')
     .text('Designed and developed by Piyush Assudani, Founder Assudani Developer  |  Contact: 9413879444', 0, pageHeight - 40, { align: 'center' });

  doc.end();
}

module.exports = generateCertificate;
