import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

export const useProductSummary = (productId: string) => {
  const api = useApi();

  return useQuery<string>({
    queryKey: ["summary", productId],
    queryFn: async () => {
      const { data } = await api.get(`/summary/${productId}`);
      console.log("summary", data.summary);
      return data.summary ?? "";
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // cache for 10 minutes
  });
};
