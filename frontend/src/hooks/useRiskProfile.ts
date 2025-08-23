import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRiskAssessment } from "./useAI";
import { useRouter } from "next/navigation";

export function useRiskProfile() {
  const { address, isConnected } = useAccount();
  const { riskScore, riskProfile, isLoading } = useRiskAssessment();
  const router = useRouter();

  // useEffect(() => {
  //   // Set cookie to indicate profile status
  //   if (riskProfile && riskScore !== null) {
  //     document.cookie = `hasRiskProfile=true; path=/; max-age=${60 * 60 * 24 * 30}` // 30 days
  //   }
  // }, [riskProfile, riskScore])

  const checkProfileAndRedirect = (redirectTo: string = "/dashboard") => {
    if (!isConnected) {
      router.push("/onboarding");
      return false;
    }

    if (!riskProfile || riskScore === null) {
      router.push(`/onboarding?redirect=${encodeURIComponent(redirectTo)}`);
      return false;
    }

    return true;
  };

  const clearProfile = () => {
    // Clear cookie
    document.cookie =
      "hasRiskProfile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Note: Profile data is cleared on the server side when needed
  };

  return {
    riskScore,
    riskProfile,
    isLoading,
    hasProfile: !!(riskProfile && riskScore !== null),
    checkProfileAndRedirect,
    clearProfile,
  };
}
