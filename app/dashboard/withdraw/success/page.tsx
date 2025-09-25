// app/dashboard/withdraw/success/page.tsx
import { Suspense } from 'react';
import WithdrawSuccessPage from './WithdrawSuccessPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <WithdrawSuccessPage />
    </Suspense>
  );
}
