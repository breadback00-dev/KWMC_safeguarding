'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function CheckinPage() {
    const params = useParams();
    const childId = params.childId as string;
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleCheckIn = async () => {
        setStatus('loading');
        try {
            const res = await fetch(`/api/checkin/${childId}`, { method: 'POST' });
            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Child Check-In</h1>

                {status === 'idle' && (
                    <>
                        <p className="text-gray-600 mb-8">
                            Click the button below to confirm arrival and notify parents.
                        </p>
                        <button
                            onClick={handleCheckIn}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
                        >
                            Confirm Check-In
                        </button>
                    </>
                )}

                {status === 'loading' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Processing check-in...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-6">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-600 mb-2">Checked In Successfully</h2>
                        <p className="text-gray-600">
                            The arrival SMS has been sent to the parent.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-6">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Check-In Failed</h2>
                        <p className="text-gray-600 mb-8">
                            There was a problem processing this check-in. Please try again.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
