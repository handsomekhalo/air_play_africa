'use client';

import { useSearchParams } from 'next/navigation';
import StepOneOnboarding from '../Components/Artists/onboarding/onboarding_step_1';
import StepTwoOnboarding from '../Components/Artists/onboarding/onboarding_step_2';

export default function ArtistOnboardingPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') || '1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className={step === '1' ? 'font-semibold text-indigo-600' : ''}>
            Step 1
          </span>
          <span>→</span>
          <span className={step === '2' ? 'font-semibold text-indigo-600' : ''}>
            Step 2
          </span>
        </div>

        {/* Step content */}
        {step === '1' && <StepOneOnboarding />}
        {step === '2' && <StepTwoOnboarding />}
      </div>
    </div>
  );
}
