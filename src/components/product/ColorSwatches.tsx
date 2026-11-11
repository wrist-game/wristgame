import type { ProductColor } from '../../types';

interface ColorSwatchesProps {
  colors: ProductColor[];
  value: string;
  onChange: (name: string) => void;
  /** Unique name for the radio group. */
  name: string;
}

export function ColorSwatches({ colors, value, onChange, name }: ColorSwatchesProps) {
  return (
    <fieldset className="swatches">
      <legend className="field-label">
        Colour: <span className="swatches__current">{value}</span>
      </legend>
      <div className="swatches__list">
        {colors.map((color) => (
          <label key={color.name} className="swatch" title={color.name}>
            <input type="radio" name={name} value={color.name} checked={value === color.name} onChange={() => onChange(color.name)} />
            <span className="swatch__dot" style={{ background: color.swatch }} aria-hidden="true" />
            <span className="sr-only">{color.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
