'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/feed');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex flex-col items-center">
          <span className="font-extrabold text-2xl tracking-tight text-gray-900">
            Cidadão
          </span>
          <span className="font-extrabold text-2xl tracking-tight text-emerald-600 -mt-1">
            Connect
          </span>
        </div>
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

