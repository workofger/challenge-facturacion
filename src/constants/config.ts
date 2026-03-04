// Configuration constants
export const CONFIG = {
  // Expected receiver RFC for validation
  // TODO: Configure with your company's RFC
  EXPECTED_RECEIVER_RFC: "XAXX010101000",
  
  // API Base URL - configure when backend is ready
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  
  // Supported currencies
  CURRENCIES: ['MXN', 'USD'] as const,
  
  // Payment methods
  PAYMENT_METHODS: {
    PUE: 'PUE',
    PPD: 'PPD',
  } as const,
} as const;

export type Currency = typeof CONFIG.CURRENCIES[number];
export type PaymentMethod = keyof typeof CONFIG.PAYMENT_METHODS | '';
