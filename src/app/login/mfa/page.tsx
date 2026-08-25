import { Suspense } from "react";
import { MfaChallengeForm } from "./MfaChallengeForm";

export default function MfaChallengePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Suspense fallback={null}>
        <MfaChallengeForm />
      </Suspense>
    </div>
  );
}
