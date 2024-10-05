export interface Bank {
    id: string;
    name: string;
    email: string;
    phone: string;
  }
  
  export const banks: Bank[] = [
    {
      id: 'gb001',
      name: 'GlobalBank',
      email: 'ds45akash2004@gmail.com',
      phone: '1-800-123-4567'
    },
    {
      id: 'cf002',
      name: 'CityFinance',
      email: 'help@cityfinance.com',
      phone: '1-888-765-4321'
    },
    {
      id: 'nt003',
      name: 'NationalTrust',
      email: 'care@nationaltrust.com',
      phone: '1-877-987-6543'
    },
    {
      id: 'mc004',
      name: 'MetroCredit',
      email: 'support@metrocredit.com',
      phone: '1-866-555-1212'
    },
    {
      id: 'ub005',
      name: 'UnionBank',
      email: 'customerservice@unionbank.com',
      phone: '1-855-999-8888'
    }
  ];