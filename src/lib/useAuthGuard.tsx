// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { auth } from '@/lib/firebase';
// import { onAuthStateChanged, User } from 'firebase/auth';

// export function useAuthGuard() {
//   const [user, setUser] = useState<User | null | undefined>(undefined);
//   const router = useRouter();

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       if (!u) {
//         router.replace('/'); // redirect to login page
//       }
//     });
//     return () => unsub();
//   }, [router]);

//   return user;
// }



'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useAuthGuard() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        router.replace('/login'); // not logged in → login
      } 
    });
    return () => unsub();
  }, [router]);

  return user;
}
