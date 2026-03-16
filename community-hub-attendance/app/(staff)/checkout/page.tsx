import { getActiveSession } from '@/lib/queries/sessions';
import { getPresentChildren } from '@/lib/queries/attendance';
import { SessionBanner } from '@/components/session/SessionBanner';
import { ChildCheckOutList } from '@/components/children/ChildCheckOutList';

export const metadata = { title: 'Check Out — Community Hub' };

export default async function CheckOutPage() {
  const session = await getActiveSession();
  const presentChildren = session ? await getPresentChildren(session.id) : [];

  return (
    <div className="space-y-5">
      <SessionBanner session={session} presentCount={presentChildren.length} />

      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Children Present
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({presentChildren.length} in building)
          </span>
        </h2>
        <ChildCheckOutList children={presentChildren} />
      </div>
    </div>
  );
}
