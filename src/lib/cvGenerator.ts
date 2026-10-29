import { jsPDF } from 'jspdf';
import { AlumniProfile, Institution, TelegramUser } from '../types';

export function generateAlumniCvPdf(
  profile: AlumniProfile,
  institution: Institution,
  user: TelegramUser
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // 1. Header Banner & Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');

  // Accent vertical stripe
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(margin, y, 4, 32, 'F');

  // User Name
  const fullName = `${user.tgFirstName} ${user.tgLastName || ''}`.trim();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(fullName, margin + 8, y + 10);

  // Subtitle / Job Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  const jobString = profile.jobTitle
    ? `${profile.jobTitle}${profile.company ? ` @ ${profile.company}` : ''}`
    : 'Alumnus';
  doc.text(jobString, margin + 8, y + 17);

  // Institution Sub-header
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${institution.name} (${institution.shortName})`, margin + 8, y + 24);

  // Verification Badge on top-right
  if (profile.verificationStatus === 'VERIFIED') {
    doc.setFillColor(6, 78, 59); // emerald-900
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.roundedRect(pageWidth - margin - 42, y + 6, 38, 9, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text('VERIFIED ALUMNUS', pageWidth - margin - 23, y + 12, { align: 'center' });
  }

  y += 38;

  // 2. Contact & Quick Metadata Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');

  const tgHandle = user.tgUsername ? `@${user.tgUsername}` : 'Telegram Verified';
  const location = profile.locationCity
    ? `${profile.locationCity}, ${profile.locationCountry || ''}`
    : 'Global Network';
  const gradText = `Class of ${profile.graduationYear}`;

  doc.text(`Telegram: ${tgHandle}`, margin + 4, y + 6);
  doc.text(`Location: ${location}`, margin + 62, y + 6);
  doc.text(`Graduation: ${gradText}`, margin + 122, y + 6);

  doc.text(`Matric No: ${profile.matriculationNo}`, margin + 4, y + 11);
  doc.text(`Department: ${profile.department}`, margin + 62, y + 11);
  doc.text(`Degree: ${profile.degreeType || 'B.Sc / B.Eng'}`, margin + 122, y + 11);

  y += 20;

  // Helper Section Renderer
  const renderSectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, margin, y);

    // Decorative line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 7;
  };

  // 3. Academic Credentials Section
  renderSectionHeader('ACADEMIC CREDENTIALS');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${institution.name}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${profile.faculty || 'Faculty of Engineering & Tech'}`, margin, y + 4.5);
  doc.text(
    `${profile.degreeType || 'Bachelor'} in ${profile.department} | ${profile.entryYear ? `${profile.entryYear} – ` : ''}${profile.graduationYear}`,
    margin,
    y + 9
  );
  doc.text(`Matriculation / Student ID: ${profile.matriculationNo}`, margin, y + 13.5);

  if (profile.portalExternalId) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Portal Verification Reference: ${profile.portalExternalId}`, margin, y + 18);
    y += 22;
  } else {
    y += 18;
  }

  // 4. Professional Summary / Bio Section
  renderSectionHeader('PROFESSIONAL SUMMARY & ALUMNI BIO');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const bioContent =
    profile.bio && profile.bio.trim()
      ? profile.bio.trim()
      : `Alumni graduate of ${institution.name}, actively collaborating across industry and contributing to professional excellence within the alumni network.`;

  const bioLines = doc.splitTextToSize(bioContent, contentWidth);
  doc.text(bioLines, margin, y);
  y += bioLines.length * 4.5 + 4;

  // 5. Skills & Core Competencies
  renderSectionHeader('CORE SKILLS & TECHNICAL COMPETENCIES');
  const skillsList = profile.skills && profile.skills.length > 0
    ? profile.skills
    : ['Systems Engineering', 'Leadership', 'Project Management', 'Problem Solving', 'Team Collaboration'];

  let skillX = margin;
  let skillY = y;
  skillsList.forEach((skill) => {
    const textWidth = doc.getTextWidth(skill) + 6;
    if (skillX + textWidth > pageWidth - margin) {
      skillX = margin;
      skillY += 7;
    }

    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(skillX, skillY - 3.5, textWidth, 5.5, 1, 1, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(skill, skillX + 3, skillY);

    skillX += textWidth + 3;
  });

  y = skillY + 11;

  // 6. Mentorship & Alumni Leadership
  renderSectionHeader('ALUMNI MENTORSHIP & ENGAGEMENT');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const isMentorText = profile.isMentor
    ? 'Active Alumni Mentor (Available for career coaching, mock interviews, and student guidance)'
    : 'Alumni Network Member';
  doc.text(`Status: ${isMentorText}`, margin, y);
  y += 5;

  if (profile.mentoringTopics && profile.mentoringTopics.length > 0) {
    doc.text(`Advisory Focus Areas: ${profile.mentoringTopics.join(' • ')}`, margin, y);
    y += 5;
  }

  if (profile.chapterName) {
    doc.text(`Regional Chapter: ${profile.chapterName}`, margin, y);
    y += 5;
  }

  if (profile.linkedinUrl) {
    doc.text(`LinkedIn: ${profile.linkedinUrl}`, margin, y);
    y += 5;
  }

  y += 6;

  // 7. Verification Seal & Footer
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);

  const dateGenerated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  doc.text(
    `Official Alumni Credential • ${institution.name} Telegram Bot Ecosystem`,
    margin,
    footerY
  );
  doc.text(`Generated: ${dateGenerated}`, pageWidth - margin, footerY, { align: 'right' });

  doc.setFontSize(6.5);
  doc.text(
    `Verification Hash: TG-ALUMNI-${institution.slug.toUpperCase()}-${profile.matriculationNo.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`,
    margin,
    footerY + 4
  );

  // Trigger browser download
  const sanitizedName = fullName.replace(/\s+/g, '_');
  doc.save(`${sanitizedName}_${institution.shortName.replace(/\s+/g, '_')}_Alumni_CV.pdf`);
}
