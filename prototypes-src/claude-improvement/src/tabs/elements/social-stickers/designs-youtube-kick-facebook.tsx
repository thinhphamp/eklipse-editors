import type { StickerRender } from './types';
import { PlatformIcon } from '../PlatformIcon';
import './stickers-youtube-kick-facebook.css';

type Platform = 'Youtube' | 'Kick' | 'Facebook';

function YoutubeIcon() {
  return <svg className="stk-youtube-kick-facebook-youtube-icon" viewBox="0 0 24 18" aria-hidden="true">
    <rect x="1" y="2" width="22" height="14" rx="3.5" />
    <path d="m10 6 6 3-6 3Z" />
  </svg>;
}

function FacebookIcon() {
  return <svg className="stk-youtube-kick-facebook-facebook-icon" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9" />
    <path d="M11.4 17v-6h2l.3-2.3h-2.3V7.2c0-.7.2-1.1 1.2-1.1h1.2V4a16 16 0 0 0-1.8-.1c-1.8 0-3.1 1.1-3.1 3.2v1.6H7V11h1.9v6Z" />
  </svg>;
}

function SocialIcon({ platform }: { platform: Platform }) {
  if (platform === 'Youtube') return <YoutubeIcon />;
  if (platform === 'Facebook') return <FacebookIcon />;
  return <PlatformIcon platform={platform} />;
}

function BasicSticker({ name, platform, design }: { name: string; platform: Platform; design: string }) {
  return <span className={`stk-youtube-kick-facebook-sticker stk-youtube-kick-facebook-${design}`}>
    <span className="stk-youtube-kick-facebook-icon"><SocialIcon platform={platform} /></span>
    <b className="stk-youtube-kick-facebook-name">{name}</b>
  </span>;
}

function Sparkles() {
  return <svg className="stk-youtube-kick-facebook-sparkles" viewBox="0 0 150 32" aria-hidden="true">
    <path d="M4 1.5 5.3 7 8 9.2l-2.7 2.2L4 17l-1.3-5.6L0 9.2 2.7 7Z" />
    <path d="m11 15 .7 2.6L13 19l-1.3 1.4L11 23l-.7-2.6L9 19l1.3-1.4Z" />
    <path d="m146 0 1.3 5.6 2.7 2.2-2.7 2.2-1.3 5.6-1.3-5.6-2.7-2.2 2.7-2.2Z" />
    <path d="m139 17 .7 2.6L141 21l-1.3 1.4L139 25l-.7-2.6L137 21l1.3-1.4Z" />
  </svg>;
}

function PetOneLeft() {
  return <svg className="stk-youtube-kick-facebook-pet stk-youtube-kick-facebook-pet-one-left" viewBox="0 0 38 34" aria-hidden="true">
    <path d="M8 18c0-7 5-12 13-12 6 0 10 4 10 9 0 7-6 12-15 12-5 0-8-3-8-9Z" fill="var(--stk-ykf-pet-cream)" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.5" />
    <path d="m10 9-7 4 6 6m19-9 7-2-4 8" fill="var(--stk-ykf-pet-orange)" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M15 5c3-3 10-3 13 1l-3 5H14Z" fill="var(--stk-ykf-pet-gray)" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.3" />
    <circle cx="16" cy="15" r="1.2" fill="var(--stk-ykf-pet-ink)" /><circle cx="24" cy="15" r="1.2" fill="var(--stk-ykf-pet-ink)" />
    <path d="m18 19 2 1.5 2-1.5m-6 7-1 6m10-6 2 5" fill="none" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>;
}

function PetOneRight() {
  return <svg className="stk-youtube-kick-facebook-pet stk-youtube-kick-facebook-pet-one-right" viewBox="0 0 40 34" aria-hidden="true">
    <path d="M9 13c3-7 12-10 20-6 6 3 7 10 3 15-4 6-15 7-22 2-4-3-4-7-1-11Z" fill="var(--stk-ykf-pet-tan)" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.4" />
    <path d="m10 12-7-5 2 10m24-9 8 2-6 6" fill="var(--stk-ykf-pet-tan)" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="m13 9 5 5-4 4-5-5Zm5 5 5-5 4 4-5 5Z" fill="var(--stk-ykf-pet-blue)" stroke="var(--stk-ykf-pet-ink)" strokeWidth=".8" />
    <circle cx="25" cy="15" r="1.1" fill="var(--stk-ykf-pet-ink)" />
    <path d="M31 18q4 1 5-2m-22 9-2 7m14-7 2 7" fill="none" stroke="var(--stk-ykf-pet-ink)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>;
}

function PetTwoLeft() {
  return <svg className="stk-youtube-kick-facebook-pet stk-youtube-kick-facebook-pet-two-left" viewBox="0 0 42 30" aria-hidden="true">
    <path d="M4 12c6-7 16-8 25-4 6 3 7 8 4 11-4 4-15 5-23 2-6-2-8-5-6-9Z" fill="var(--stk-ykf-fox-orange)" />
    <path d="m5 12-2-8 8 5m18 0 7-5-2 10" fill="var(--stk-ykf-fox-orange)" stroke="var(--stk-ykf-fox-dark)" strokeWidth="1" strokeLinejoin="round" />
    <path d="M10 17c7 3 13 3 19-1" fill="none" stroke="var(--stk-ykf-fox-pale)" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="25" cy="12" r="1" fill="var(--stk-ykf-fox-dark)" />
    <path d="M9 21 6 28m21-7 4 6" stroke="var(--stk-ykf-fox-dark)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>;
}

function PetTwoRight() {
  return <svg className="stk-youtube-kick-facebook-pet stk-youtube-kick-facebook-pet-two-right" viewBox="0 0 42 30" aria-hidden="true">
    <path d="M8 13c1-6 7-9 14-7 7-3 14 1 15 8 1 7-5 11-14 11-10 0-16-5-15-12Z" fill="var(--stk-ykf-pillow-blue)" />
    <path d="m10 11-1-8 7 5m14 0 6-5-1 9" fill="var(--stk-ykf-pillow-blue)" stroke="var(--stk-ykf-pillow-dark)" strokeWidth="1" strokeLinejoin="round" />
    <path d="M13 23c6-4 15-4 21 0" fill="none" stroke="var(--stk-ykf-pillow-pale)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="18" cy="13" r="1" fill="var(--stk-ykf-pillow-dark)" /><circle cx="28" cy="13" r="1" fill="var(--stk-ykf-pillow-dark)" />
  </svg>;
}

function DecoratedSticker({ name, platform, design, decoration }: { name: string; platform: Platform; design: string; decoration: 'sparkles' | 'pets-one' | 'pets-two' }) {
  return <span className={`stk-youtube-kick-facebook-sticker stk-youtube-kick-facebook-${design}`}>
    {decoration === 'sparkles' && <Sparkles />}
    {decoration === 'pets-one' && <><PetOneLeft /><PetOneRight /></>}
    {decoration === 'pets-two' && <><PetTwoLeft /><PetTwoRight /></>}
    <span className="stk-youtube-kick-facebook-icon"><SocialIcon platform={platform} /></span>
    <b className="stk-youtube-kick-facebook-name">{name}</b>
  </span>;
}

export const renders: Record<string, StickerRender> = {
  'sl-syt01': name => <BasicSticker name={name} platform="Youtube" design="dark-plate" />,
  'sl-syt02': name => <BasicSticker name={name} platform="Youtube" design="youtube-block" />,
  'sl-syt03': name => <BasicSticker name={name} platform="Youtube" design="youtube-cap" />,
  'sl-syt04': name => <BasicSticker name={name} platform="Youtube" design="youtube-shadow" />,
  'sl-syt05': name => <BasicSticker name={name} platform="Youtube" design="blue-gradient" />,
  'sl-syt06': name => <BasicSticker name={name} platform="Youtube" design="youtube-pale" />,
  'sl-syt07': name => <BasicSticker name={name} platform="Youtube" design="youtube-solid" />,
  'sl-syt08': name => <BasicSticker name={name} platform="Youtube" design="youtube-neon" />,
  'sl-syt09': name => <DecoratedSticker name={name} platform="Youtube" design="sparkle" decoration="sparkles" />,
  'sl-syt10': name => <DecoratedSticker name={name} platform="Youtube" design="pet-bar" decoration="pets-one" />,
  'sl-syt11': name => <DecoratedSticker name={name} platform="Youtube" design="pet-bar" decoration="pets-two" />,
  'sl-ski01': name => <BasicSticker name={name} platform="Kick" design="dark-plate" />,
  'sl-ski02': name => <BasicSticker name={name} platform="Kick" design="kick-block" />,
  'sl-ski03': name => <BasicSticker name={name} platform="Kick" design="kick-cap" />,
  'sl-ski04': name => <BasicSticker name={name} platform="Kick" design="kick-shadow" />,
  'sl-sfb01': name => <BasicSticker name={name} platform="Facebook" design="facebook-plate" />,
  'sl-sfb02': name => <BasicSticker name={name} platform="Facebook" design="blue-gradient" />,
  'sl-sfb03': name => <BasicSticker name={name} platform="Facebook" design="facebook-pale" />,
  'sl-sfb04': name => <BasicSticker name={name} platform="Facebook" design="facebook-solid" />,
  'sl-sfb05': name => <BasicSticker name={name} platform="Facebook" design="facebook-neon" />,
  'sl-sfb06': name => <DecoratedSticker name={name} platform="Facebook" design="sparkle" decoration="sparkles" />,
  'sl-sfb07': name => <DecoratedSticker name={name} platform="Facebook" design="pet-bar" decoration="pets-one" />,
  'sl-sfb08': name => <DecoratedSticker name={name} platform="Facebook" design="pet-bar" decoration="pets-two" />,
};
