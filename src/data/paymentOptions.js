function qrPlaceholderDataUri(label, account) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <rect width="320" height="320" fill="#fff8ee"/>
      <rect x="22" y="22" width="276" height="276" rx="14" fill="#ffffff" stroke="#8a1c2a" stroke-width="4"/>
      <g fill="#202124">
        <rect x="48" y="48" width="66" height="66" rx="4"/>
        <rect x="206" y="48" width="66" height="66" rx="4"/>
        <rect x="48" y="206" width="66" height="66" rx="4"/>
        <rect x="64" y="64" width="34" height="34" fill="#ffffff"/>
        <rect x="222" y="64" width="34" height="34" fill="#ffffff"/>
        <rect x="64" y="222" width="34" height="34" fill="#ffffff"/>
        <rect x="136" y="54" width="22" height="22"/>
        <rect x="166" y="54" width="15" height="15"/>
        <rect x="138" y="92" width="54" height="18"/>
        <rect x="126" y="130" width="24" height="24"/>
        <rect x="164" y="126" width="18" height="58"/>
        <rect x="202" y="138" width="24" height="24"/>
        <rect x="236" y="134" width="32" height="18"/>
        <rect x="132" y="204" width="18" height="64"/>
        <rect x="166" y="212" width="38" height="18"/>
        <rect x="224" y="202" width="18" height="18"/>
        <rect x="252" y="224" width="18" height="44"/>
        <rect x="192" y="248" width="42" height="18"/>
      </g>
      <text x="160" y="158" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#8a1c2a">${label}</text>
      <text x="160" y="184" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#57534e">${account}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const paymentOptions = [
  {
    id: 'esewa',
    label: 'eSewa',
    account: 'Replace with eSewa ID',
    qrImage: qrPlaceholderDataUri('eSewa QR', 'Placeholder'),
  },
  {
    id: 'khalti',
    label: 'Khalti',
    account: 'Replace with Khalti ID',
    qrImage: qrPlaceholderDataUri('Khalti QR', 'Placeholder'),
  },
  {
    id: 'bank',
    label: 'Bank QR',
    account: 'Replace with bank account',
    qrImage: qrPlaceholderDataUri('Bank QR', 'Placeholder'),
  },
];
