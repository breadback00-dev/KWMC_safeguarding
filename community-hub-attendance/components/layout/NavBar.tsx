import Link from 'next/link';
import { signOut } from '@/lib/actions/auth';

interface NavBarProps {
  userEmail?: string;
}

export function NavBar({ userEmail }: NavBarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="text-sm font-bold text-gray-900 tracking-tight">
          Community Hub
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/safeguarding"
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            All Incidents
          </Link>

          {userEmail && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
