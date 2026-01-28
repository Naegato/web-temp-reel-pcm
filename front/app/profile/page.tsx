import { getCurrentUser } from '@/lib/auth/server-utils';
import { redirect } from 'next/navigation';

/**
 * Protected Profile page that shows user data from /auth/profile
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();

  // If no user, redirect to login (this is a backup to the proxy)
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Account Details</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="text-lg">{user.firstname}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="text-lg">{user.lastname}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="text-lg">{user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{user.id}</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Data Source:</strong> This information is securely fetched from the 
              <code className="bg-background px-1 py-0.5 rounded text-xs ml-1">/auth/profile</code> 
              endpoint using your authenticated session.
            </p>
          </div>
        </div>

        {/* Authentication Info */}
        <div className="mt-8 bg-green-50 dark:bg-green-950 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Authenticated Session
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                You are securely logged in. Your profile data is fetched from the backend API using JWT authentication stored in secure httpOnly cookies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}