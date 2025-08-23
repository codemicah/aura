import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { apiClient } from "@/utils/api";

const useRiskProfile = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskProfile, setRiskProfile] = useState<
    "Conservative" | "Balanced" | "Aggressive" | null
  >(null);

  const execute = useCallback(async () => {
    setError(null);
    try {
      const profile = await apiClient.getUserProfile(address!);
      setRiskScore(profile!.riskScore);
      setRiskProfile(profile!.riskProfile);
    } catch (err) {
      setError("Failed to load risk profile");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    execute();
  }, [execute, address]);

  return { riskScore, riskProfile, isLoading, error, refetch: execute };
};

export default useRiskProfile;
