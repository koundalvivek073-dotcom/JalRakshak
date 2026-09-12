export const borewells = [
  { id: 'BW-104', name: 'Kalyan Nagar community well', type: 'Borewell', lat: 13.0281, lng: 77.6403, score: 91, status: 'safe', tested: '12 min ago', note: 'All core metrics in range' },
  { id: 'BW-087', name: 'HRBR Layout park well', type: 'Borewell', lat: 13.0196, lng: 77.6431, score: 68, status: 'caution', tested: '38 min ago', note: 'Elevated hardness detected' },
  { id: 'BW-121', name: 'Kammanahalli school well', type: 'Borewell', lat: 13.0157, lng: 77.6367, score: 34, status: 'danger', tested: '1 hr ago', note: 'Fluoride above safe limit' },
  { id: 'TK-022', name: 'AquaSure tanker · KA 03 AB 8891', type: 'Tanker', lat: 13.0351, lng: 77.6288, score: 86, status: 'safe', tested: '2 hrs ago', note: 'Verified source · 3 scans' },
  { id: 'BW-064', name: 'Lingarajapuram temple well', type: 'Borewell', lat: 13.0019, lng: 77.6257, score: 56, status: 'caution', tested: '3 hrs ago', note: 'Nitrates trending upward' },
];

export const tankers = [
  { name: 'AquaSure Water Co.', initials: 'AW', rating: 4.8, scans: 18, lastScan: 'Today, 08:42', status: 'verified', route: 'North Bengaluru' },
  { name: 'Crystal Drop Supply', initials: 'CD', rating: 4.5, scans: 11, lastScan: 'Yesterday, 17:20', status: 'verified', route: 'HRBR Layout' },
  { name: 'BlueSpring Tankers', initials: 'BS', rating: 3.7, scans: 6, lastScan: 'Aug 20, 13:05', status: 'review', route: 'Kammanahalli' },
  { name: 'Namma Neeru Collective', initials: 'NN', rating: 4.9, scans: 24, lastScan: 'Today, 07:15', status: 'verified', route: 'Hennur Main Road' },
];

export const defaultScan = { fluoride: 1.8, ph: 7.4, nitrates: 29, hardness: 340, score: 54 };
