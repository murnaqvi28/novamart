export default function QtyStepper({ value, onChange, min = 1, max = 99, disabled, testid = 'qty' }) {
  return (
    <div className="qty" data-testid={testid}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity" data-testid={`${testid}-decrease`}>−</button>
      <span data-testid={`${testid}-value`}>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity" data-testid={`${testid}-increase`}>+</button>
    </div>
  );
}
