export function PlatformIcon({platform}:{platform:string}){
 const name=platform.toLowerCase();
 if(name==='youtube')return <svg viewBox="0 0 24 24" aria-label="YouTube"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 8.5 16 12l-6 3.5Z" fill="var(--art-ffffff)"/></svg>;
 if(name==='facebook')return <svg viewBox="0 0 24 24" aria-label="Facebook"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M13 20v-7h2l.4-3H13V8.5c0-.8.3-1.2 1.2-1.2H16V5h-2.5C11 5 10 6.5 10 8.5V10H8v3h2v7Z" fill="var(--art-ffffff)"/></svg>;
 if(name==='kick')return <svg viewBox="0 0 24 24" aria-label="Kick"><path d="M3 3h5v7h3V7h4V3h6v6h-4v6h4v6h-6v-4h-4v-4H8v8H3Z" fill="currentColor"/></svg>;
 return <svg viewBox="0 0 24 24" aria-label="Twitch"><path d="M4 2h18v13l-5 5h-5l-3 3H6v-3H2V7Z" fill="currentColor"/><path d="M7 5v11h4v3l3-3h4l2-2V5Z" fill="var(--art-ffffff)"/><path d="M11 8v5m5-5v5" stroke="currentColor" strokeWidth="2"/></svg>;
}
