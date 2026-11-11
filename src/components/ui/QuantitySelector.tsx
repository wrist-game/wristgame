import { catalogSettings } from '../../data/products';
import { MinusIcon, PlusIcon } from './Icons';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  /** Used in the accessible labels, e.g. "Classic Gold Watch". */
  label: string;
  size?: 'md' | 'sm';
  /** Highest quantity allowed, normally what stock permits. Defaults to the per-order maximum. */
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({ value, onChange, label, size = 'md', max = catalogSettings.maxPerOrder, disabled = false }: QuantitySelectorProps) {
  const atMax = value >= max;
  return (
    <div className={`qty qty--${size} ${disabled ? 'is-disabled' : ''}`} role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className="qty__btn" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        <MinusIcon />
      </button>
      <output className="qty__value" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
        title={atMax && !disabled ? 'No more available' : undefined}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
