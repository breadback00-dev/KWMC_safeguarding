import React from 'react';

export default async function CheckinPage({ params }: { params: Promise<{ childId: string }> }) {
    const { childId } = await params;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4">Check-in</h1>
                <p className="mb-4">Processing check-in for child ID: {childId}</p>
                {/* TODO: Call check-in API here via client component or server action */}
            </div>
        </div>
    );
}
