import { getActiveSession } from '@/lib/queries/sessions';
import { getActiveChildren } from '@/lib/queries/children';
import { getPresentChildren } from '@/lib/queries/attendance';
import { SessionBanner } from '@/components/session/SessionBanner';
import { ChildCheckInList } from '@/components/children/ChildCheckInList';

export const metadata = { title: 'Check In — Community Hub' };

export default async function CheckInPage() {
  const session = await getActiveSession();

  // Fetch all children and who's already present in parallel
  const [allChildren, presentChildren] = await Promise.all([
    getActiveChildren(),
    session ? getPresentChildren(session.id) : Promise.resolve([]),
  ]);

  const alreadyCheckedInIds = presentChildren.map(c => c.id);

  return (
    <div className="space-y-5">
      <SessionBanner session={session} presentCount={presentChildren.length} />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Staff Check-In
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({allChildren.length} registered)
          </span>
        </h2>
        <ChildCheckInList
          children={allChildren}
          initialCheckedInIds={alreadyCheckedInIds}
        />
      </div>
    </div>
  );
}
