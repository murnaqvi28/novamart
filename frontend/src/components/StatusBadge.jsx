export default function StatusBadge({ status }) {
  return <span className={`status status--${status}`} data-testid="order-status">{status[0].toUpperCase() + status.slice(1)}</span>;
}
