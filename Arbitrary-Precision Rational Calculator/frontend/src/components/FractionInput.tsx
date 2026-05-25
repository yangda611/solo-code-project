import { component$, $ } from '@builder.io/qwik';

interface FractionInputProps {
  numerator: { value: string };
  denominator: { value: string };
  label: string;
  onError$: (error: string) => void;
}

export const FractionInput = component$<FractionInputProps>(({ numerator, denominator, label }) => {
  return (
    <div class="form-group">
      <label>{label}</label>
      <div class="fraction-input">
        <input
          type="text"
          class="input"
          value={numerator.value}
          onInput$={(e) => {
            const target = e.target as HTMLInputElement;
            numerator.value = target.value;
          }}
          placeholder="分子"
        />
      </div>
      <div style={{ textAlign: 'center', margin: '5px 0' }}>
        <div style={{ width: '60%', height: '3px', background: 'var(--border-color)', margin: '0 auto' }}></div>
      </div>
      <div class="fraction-input">
        <input
          type="text"
          class="input"
          value={denominator.value}
          onInput$={(e) => {
            const target = e.target as HTMLInputElement;
            denominator.value = target.value;
          }}
          placeholder="分母"
        />
      </div>
    </div>
  );
});
