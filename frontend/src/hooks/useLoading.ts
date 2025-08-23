import { useLoadingContext } from "../contexts/LoadingContext";

export const useLoading = () => {
  const { isLoading, setLoading } = useLoadingContext();
  return { isLoading, setLoading };
};
