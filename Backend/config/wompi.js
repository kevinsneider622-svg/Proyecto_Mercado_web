import 'dotenv/config';

const wompiConfig = {
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  apiUrl: process.env.WOMPI_ENV === 'production' 
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000'
};

export default wompiConfig;