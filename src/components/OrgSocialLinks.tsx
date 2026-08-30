import React from 'react';
import {
  Globe,
  Instagram,
  Twitter,
  Music2,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle,
  Link2,
} from 'lucide-react';

export interface SocialLinkValue {
  platform: string;
  url: string;
}

export const SOCIAL_PLATFORMS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

const PLATFORM_META: Record<string, { Icon: typeof Globe; label: string }> = {
  instagram: { Icon: Instagram, label: 'Instagram' },
  twitter: { Icon: Twitter, label: 'Twitter / X' },
  tiktok: { Icon: Music2, label: 'TikTok' },
  facebook: { Icon: Facebook, label: 'Facebook' },
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  youtube: { Icon: Youtube, label: 'YouTube' },
  whatsapp: { Icon: MessageCircle, label: 'WhatsApp' },
  website: { Icon: Globe, label: 'Website' },
};

export function socialMeta(platform: string) {
  return PLATFORM_META[platform] || { Icon: Link2, label: platform || 'Link' };
}

export function normalizeSocialUrl(platform: string, url: string): string {
  let u = (url || '').trim();
  if (!u) return '';
  if (platform === 'instagram' || platform === 'twitter' || platform === 'tiktok' || platform === 'facebook' || platform === 'linkedin' || platform === 'youtube' || platform === 'whatsapp') {
    u = u.replace(/^@/, '');
  }
  if (!u.includes('://')) {
    if (platform === 'instagram') u = `https://instagram.com/${u}`;
    else if (platform === 'twitter') u = `https://twitter.com/${u}`;
    else if (platform === 'tiktok') u = `https://tiktok.com/@${u}`;
    else if (platform === 'facebook') u = `https://facebook.com/${u}`;
    else if (platform === 'linkedin') u = `https://linkedin.com/in/${u}`;
    else if (platform === 'youtube') u = `https://youtube.com/@${u}`;
    else if (platform === 'whatsapp') u = `https://wa.me/${u.replace(/\D/g, '')}`;
    else u = `https://${u}`;
  }
  return u;
}

export default function OrgSocialLinks({
  links,
  className,
}: {
  links: SocialLinkValue[];
  className?: string;
}) {
  const visible = (links || []).filter((l) => l.url && l.url.trim());
  if (visible.length === 0) return null;
  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-2.5">
        {visible.map((l, i) => {
          const { Icon, label } = socialMeta(l.platform);
          const href = normalizeSocialUrl(l.platform, l.url);
          return (
            <li key={i}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 transition-all active:scale-95 shadow-sm"
              >
                <Icon className="w-4.5 h-4.5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}