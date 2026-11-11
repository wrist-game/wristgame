import type { PaymentMethodId, PaymentMethodOption } from '../../lib/payments/types';

interface PaymentMethodSelectorProps {
  /** The options to show, from getPaymentMethods(). This component decides nothing about payments itself. */
  methods: PaymentMethodOption[];
  value: PaymentMethodId | null;
  onChange: (id: PaymentMethodId) => void;
  error?: string;
}

/**
 * Radio cards for choosing how to pay. Purely presentational: what is offered,
 * the wording and what is available all come from src/config/payments.ts.
 * It has no card fields and never will — card details are only ever typed on a
 * payment provider's own page.
 */
export function PaymentMethodSelector({ methods, value, onChange, error }: PaymentMethodSelectorProps) {
  const selected = methods.find((method) => method.id === value && method.available);

  return (
    <fieldset className={`pay-methods ${error ? 'has-error' : ''}`} aria-describedby={error ? 'payment-error' : undefined}>
      <legend className="field-label">Payment method</legend>

      <div className="pay-methods__list">
        {methods.map((method) => (
          <label key={method.id} className={`pay-method ${value === method.id ? 'is-selected' : ''} ${method.available ? '' : 'is-disabled'}`}>
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={value === method.id}
              disabled={!method.available}
              onChange={() => onChange(method.id)}
              aria-describedby={`pay-${method.id}-desc`}
            />
            <span className="pay-method__dot" aria-hidden="true" />
            <span className="pay-method__text">
              <span className="pay-method__title">
                {method.label}
                {method.badge && <span className={`pay-method__badge ${method.available ? '' : 'pay-method__badge--off'}`}>{method.badge}</span>}
              </span>
              <span className="pay-method__desc" id={`pay-${method.id}-desc`}>
                {method.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="field__error" id="payment-error" role="alert">
          {error}
        </p>
      )}

      {selected && (selected.instructions.length > 0 || selected.details.length > 0) && (
        <div className="pay-details" aria-live="polite">
          <h3>How {selected.label.toLowerCase()} works</h3>
          {selected.instructions.length > 0 && (
            <ol className="pay-details__steps">
              {selected.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {selected.details.length > 0 && (
            <dl className="pay-details__accounts">
              {selected.details.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>
                    {row.value.trim() ? (
                      row.value
                    ) : (
                      <span className="placeholder" title="Add this in src/config/payments.ts">
                        to be added
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </fieldset>
  );
}
