import { redirect } from 'next/navigation';

// Order history lives in the account area ("My Orders").
export default function OrdersPage() {
  redirect('/profile');
}
