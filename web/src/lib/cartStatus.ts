/**
 * Maps a cart/order status to its design-system badge class. Pure +
 * presentational — shared by the Dashboard and Orders lists so the status
 * pills stay identical across screens.
 */
export function cartStatusBadge(status?: string | null): string {
  switch (status) {
    case 'paid':
      return 'badge-success';
    case 'printed':
      return 'badge-info';
    case 'completed':
      return 'badge-primary';
    case 'draft':
    default:
      return 'badge-neutral';
  }
}

export default cartStatusBadge;
