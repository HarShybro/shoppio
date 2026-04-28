import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

interface CreateReviewData {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string; // ← add
}

interface ReviewUser {
  name: string;
  image: string | null;
}

export interface ProductReview {
  _id: string;
  rating: number;
  comment: string;
  sentiment: {
    // ← add
    label: "positive" | "neutral" | "negative" | "none";
    score: number;
  };
  createdAt: string;
  user: ReviewUser;
}

export const useReviews = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  const createReview = useMutation({
    mutationFn: async (data: CreateReviewData) => {
      const response = await api.post("/review", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    isCreatingReview: createReview.isPending,
    createReviewAsync: createReview.mutateAsync,
  };
};

// ← NEW hook for product page
export const useProductReviews = (productId: string) => {
  const api = useApi();

  return useQuery<ProductReview[]>({
    queryKey: ["productReviews", productId],
    queryFn: async () => {
      const { data } = await api.get(`/review/product/${productId}`);
      return data.reviews ?? [];
    },
    enabled: !!productId,
  });
};
