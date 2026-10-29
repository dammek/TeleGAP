import { AlumniProfile } from '../types';

export interface MilestoneBadge {
  id: string;
  label: string;
  description: string;
  iconName: 'Crown' | 'Sparkles' | 'Zap' | 'ShieldCheck' | 'Award' | 'Star';
  colorClasses: string;
  borderClasses: string;
  bgClasses: string;
}

/**
 * Derives dynamic milestone achievement badges for an alumnus based on activity, tenure, and mentorship data.
 */
export function getAlumniMilestoneBadges(alumnus: AlumniProfile): MilestoneBadge[] {
  const badges: MilestoneBadge[] = [];

  // 1. Founding Alumnus (Graduated on or before 2012, or early matriculation record)
  const gradYear = alumnus.graduationYear || 2020;
  if (gradYear <= 2012 || alumnus.matriculationNo?.includes('08/') || alumnus.matriculationNo?.includes('09/') || alumnus.matriculationNo?.includes('10/')) {
    badges.push({
      id: 'founding_alumnus',
      label: 'Founding Alumnus',
      description: `Class of ${gradYear} veteran pioneer of the institution network.`,
      iconName: 'Crown',
      colorClasses: 'text-amber-300',
      borderClasses: 'border-amber-500/40',
      bgClasses: 'bg-gradient-to-r from-amber-950/80 to-amber-900/60'
    });
  }

  // 2. Top Mentor (Is mentor, active with skills, mentorship flag or profile visibility)
  if (alumnus.isMentor) {
    const isTopTier = (alumnus.skills?.length || 0) >= 3 || (alumnus.profileViews || 0) >= 15;
    badges.push({
      id: 'top_mentor',
      label: isTopTier ? 'Top Mentor' : 'Alumni Mentor',
      description: 'Actively offering career guidance, code reviews, and industry insights.',
      iconName: 'Sparkles',
      colorClasses: 'text-purple-300',
      borderClasses: 'border-purple-500/40',
      bgClasses: 'bg-gradient-to-r from-purple-950/80 to-indigo-950/70'
    });
  }

  // 3. Early Adopter (Registered early / genesis badge / high active engagement)
  const isEarly = alumnus.id.includes('1') || alumnus.id.includes('2') || alumnus.id.includes('3') || (alumnus.profileViews || 0) > 30;
  if (isEarly && badges.length < 3) {
    badges.push({
      id: 'early_adopter',
      label: 'Early Adopter',
      description: 'Early verified participant on the Telegram Alumni Mini-App network.',
      iconName: 'Zap',
      colorClasses: 'text-emerald-300',
      borderClasses: 'border-emerald-500/40',
      bgClasses: 'bg-gradient-to-r from-emerald-950/80 to-teal-950/70'
    });
  }

  // 4. Verified Scholar (Official institution verification)
  if (alumnus.verificationStatus === 'VERIFIED') {
    badges.push({
      id: 'verified_degree',
      label: 'Verified Scholar',
      description: 'Matriculation credentials and graduation degree verified by registrar clearance.',
      iconName: 'ShieldCheck',
      colorClasses: 'text-cyan-300',
      borderClasses: 'border-cyan-500/40',
      bgClasses: 'bg-gradient-to-r from-cyan-950/80 to-blue-950/70'
    });
  }

  return badges;
}
