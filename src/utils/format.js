export const formatINR = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const discountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};

export const parseErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const message = err?.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(err?.response?.data?.errors)) {
    return err.response.data.errors[0]?.msg || fallback;
  }
  return fallback;
};
