import { Suspense } from 'react';
import { ProfileContent } from './profile-content';
import { ProfileSkeleton } from './profile-skeleton';

/**
 * Profile Page
 * 
 * Wrapped in Suspense boundary because ProfileContent uses useSearchParams()
 * which requires Suspense for static rendering in Next.js 14+
 * 
 * @see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
