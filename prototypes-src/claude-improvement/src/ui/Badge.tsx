import { Icon } from './Icon';
// Eklipse has two plans: Free and Premium (docs/knowledge/feature-paywall-premium.md).
// Every paid tier from the reference (Starter/Creator/Pro) shows as the Premium badge.
export function Badge({tier}:{tier:'Starter'|'Creator'|'Pro'}) {return <span className={'tier-badge premium '+tier.toLowerCase()} title="Premium"><Icon name="crown" size={11}/>Premium</span>;}
