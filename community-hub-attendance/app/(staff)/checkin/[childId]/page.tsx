import { getActiveSession } from '@/lib/queries/sessions';
import { CheckInButton } from '@/components/children/CheckInButton';

export const metadata = { title: 'Check In — Community Hub' };

export default async function CheckInQRPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await getActiveSession();

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Child Check-In</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          {session?.club_name ?? 'Community Hub'}
        </p>

        {session ? (
          <CheckInButton childId={childId} />
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-6 text-center">
            <p className="font-semibold text-amber-800">No session scheduled for today.</p>
            <p className="text-sm text-amber-600 mt-1">
              Ask a coordinator to start today&apos;s session before scanning QR codes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
