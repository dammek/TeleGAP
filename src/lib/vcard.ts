import { AlumniProfile } from '../types';

/**
 * Generates an RFC 2426 vCard 3.0 string for an alumnus profile
 */
export function generateVCardString(profile: AlumniProfile): string {
  const user = profile.user;
  const firstName = user?.tgFirstName || 'Alumnus';
  const lastName = user?.tgLastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const organization = profile.company || profile.institution?.shortName || profile.institution?.name || 'Alumni Network';
  const title = profile.jobTitle || 'Alumnus';
  const department = profile.department || '';
  const institutionName = profile.institution?.name || 'University';
  const city = profile.locationCity || '';
  const country = profile.locationCountry || '';
  const telegramUsername = user?.tgUsername ? `@${user.tgUsername}` : '';
  const telegramUrl = user?.tgUsername ? `https://t.me/${user.tgUsername}` : '';
  const linkedinUrl = profile.linkedinUrl || '';
  const bio = profile.bio ? profile.bio.replace(/\n/g, ' ') : '';
  const skills = profile.skills && profile.skills.length > 0 ? profile.skills.join(', ') : '';

  const noteLines = [
    `Alumnus of ${institutionName} (${department}, Class of ${profile.graduationYear})`,
    skills ? `Skills: ${skills}` : '',
    bio ? `Bio: ${bio}` : '',
    telegramUsername ? `Telegram: ${telegramUsername}` : ''
  ].filter(Boolean).join(' | ');

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${fullName}`,
    `ORG:${organization};${department}`,
    `TITLE:${title}`,
    telegramUrl ? `URL;type=TELEGRAM:${telegramUrl}` : '',
    linkedinUrl ? `URL;type=LINKEDIN:${linkedinUrl}` : '',
    city || country ? `ADR;TYPE=WORK:;;;${city};;;${country}` : '',
    noteLines ? `NOTE:${noteLines}` : '',
    user?.tgPhotoUrl ? `PHOTO;VALUE=URI:${user.tgPhotoUrl}` : '',
    'END:VCARD'
  ].filter(Boolean).join('\r\n');

  return vcard;
}

/**
 * Downloads a .vcf contact card directly to the user's device
 */
export function downloadVCard(profile: AlumniProfile): void {
  const vcardText = generateVCardString(profile);
  const user = profile.user;
  const firstName = user?.tgFirstName || 'Alumnus';
  const lastName = user?.tgLastName || '';
  const cleanName = `${firstName}_${lastName}`.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanName}_Contact.vcf`;

  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
