// Shared Kids constants used by the navbar mega-menu, listing filters,
// vendor form and product detail size guide.

export const KIDS_AGE_GROUPS = ['0-2 years', '2-5 years', '5-9 years', '9-14 years'];

export const KIDS_AGE_LABELS = {
  '0-2 years': 'Infant',
  '2-5 years': 'Toddler',
  '5-9 years': 'Kids',
  '9-14 years': 'Teen',
};

export const KIDS_AGE_LIST = KIDS_AGE_GROUPS.map((key) => ({
  key,
  label: KIDS_AGE_LABELS[key],
  range: key,
}));

// Reference table shown next to the size selector on kids product pages.
// Sizes vary across brands, so we give parents height/weight anchors.
export const KIDS_SIZE_GUIDE = [
  { age: 'Infant · 0–2 yrs', height: '74–92 cm', weight: '8–12 kg', size: '1–2Y' },
  { age: 'Toddler · 2–5 yrs', height: '92–108 cm', weight: '12–18 kg', size: '3–4Y' },
  { age: 'Kids · 5–9 yrs', height: '108–128 cm', weight: '18–28 kg', size: '5–8Y' },
  { age: 'Teen · 9–14 yrs', height: '128–158 cm', weight: '28–48 kg', size: '9–14Y' },
];
