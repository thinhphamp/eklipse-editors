import { useEditor } from '../state';
import { Icon } from './Icon';
import './premium.css';

/**
 * Feature ids the reference editor gates by tier (REA `premium.featureIds`). Eklipse has
 * Free and Premium only; these are the ones the prototype treats as Premium.
 */
export const premiumFeatures = {
  '1080p': 'Full HD 1080p export', '4k': '4K export', '60fps': '60 fps export', 'save-template': 'Save template',
  'animated-social-stickers': 'Animated social stickers', 'captions-multiple-speakers': 'Multiple caption speakers',
  'element-animations': 'Element animations', 'filter-profanity': 'AI word censoring', 'intro-hook': 'AI hook intro title',
  'remove-silences': 'AI remove silences', 'shader-effects': 'Video effects', 'speed-control': 'Speed control',
  'text-to-speech': 'Text to speech', 'zoom-segments': 'Zoom', 'upload-custom-elements': 'Upload custom elements',
} as const;
export type PremiumFeature = keyof typeof premiumFeatures;

/** `require(id)` returns true when allowed; on the Free demo plan it opens the upsell dialog instead. */
export function usePremium() {
  const { state, actions } = useEditor();
  const isPremium = state.plan === 'premium';
  return {
    isPremium,
    require: (feature: PremiumFeature) => {
      if (isPremium) return true;
      actions.patch({ modal: 'upsell', upsellFeature: feature });
      return false;
    },
  };
}

export function UpsellDialog() {
  const { state, actions } = useEditor();
  const name = premiumFeatures[state.upsellFeature as PremiumFeature] || 'This feature';
  const close = () => actions.patch({ modal: '', upsellFeature: '' });
  return <div className="modal-shade" onMouseDown={close}>
    <div className="upsell-dialog" role="dialog" aria-modal="true" aria-label="Premium feature" onMouseDown={e => e.stopPropagation()}>
      <span className="tier-badge premium"><Icon name="crown" size={11}/>Premium</span>
      <h2>{name} is a Premium feature</h2>
      <p>Upgrade to Eklipse Premium to use it in your clips. This prototype is on the Free demo plan.</p>
      <div className="upsell-actions">
        <button onClick={close}>Not now</button>
        <button className="primary" onClick={() => actions.patch({ plan: 'premium', modal: '', upsellFeature: '', toast: 'Demo plan switched to Premium' })}>Upgrade (demo)</button>
      </div>
    </div>
  </div>;
}

/** Small switch for the demo plan (shown in the profile menu / top bar). */
export function PlanSwitch() {
  const { state, actions } = useEditor();
  return <button className="plan-switch" aria-pressed={state.plan === 'premium'} title="Demo plan: Free shows premium gates"
    onClick={() => actions.patch({ plan: state.plan === 'premium' ? 'free' : 'premium', toast: 'Demo plan: ' + (state.plan === 'premium' ? 'Free' : 'Premium') })}>
    Plan: <b>{state.plan === 'premium' ? 'Premium' : 'Free'}</b></button>;
}
