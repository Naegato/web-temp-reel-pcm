import { getCurrentUser } from '@/lib/auth/server-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * Protected Home page that requires authentication
 * Users must be logged in to access any page including the homepage
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  // If no user, redirect to login (this is a backup to the proxy)
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Banking Chat App
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Hello {user.firstname} {user.lastname}! Your secure banking communication platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Card */}
          <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-3">Start Chat</h2>
            <p className="text-muted-foreground mb-4">
              Connect with a banking advisor for assistance.
            </p>
            <Link href="/chat" className="inline-flex items-center text-primary hover:underline">
              Start Conversation →
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-3">Profile</h2>
            <p className="text-muted-foreground mb-4">
              Manage your account settings and preferences.
            </p>
            <Link href="/profile" className="inline-flex items-center text-primary hover:underline">
              View Profile →
            </Link>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-12 bg-muted rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {user.firstname} {user.lastname}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Status:</strong> 
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Secure Session
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Your session is protected with secure authentication. All communications are encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}