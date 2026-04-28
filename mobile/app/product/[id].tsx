import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import { useProductSummary } from "@/hooks/useProductSummary";
import { useProductReviews, ProductReview } from "@/hooks/useReviews";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
  Modal,
} from "react-native";

const { width } = Dimensions.get("window");

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: product, isError, isLoading } = useProduct(id);
  const { addToCart, isAddingToCart } = useCart();
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch,
  } = useProductSummary(id);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const { data: reviews, isLoading: isReviewsLoading } = useProductReviews(id);

  console.log(id);
  console.log("Summary:", summary);
  console.log("Loading:", isSummaryLoading);

  const handleAISummary = async () => {
    setSummaryModalVisible(true);
    if (!summary) {
      await refetch();
    }
  };

  const {
    isInWishlist,
    toggleWishlist,
    isAddingToWishlist,
    isRemovingFromWishlist,
  } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () =>
          Alert.alert("Success", `${product.name} added to cart!`),
        onError: (error: any) => {
          Alert.alert(
            "Error",
            error?.response?.data?.error || "Failed to add to cart",
          );
        },
      },
    );
  };

  if (isLoading) return <LoadingUI />;
  if (isError || !product) return <ErrorUI />;

  const inStock = product.stock > 0;

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-20 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-black/50 backdrop-blur-xl w-12 h-12 rounded-full items-center justify-center"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isInWishlist(product._id)
              ? "bg-primary"
              : "bg-black/50 backdrop-blur-xl"
          }`}
          onPress={() => toggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
          activeOpacity={0.7}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isInWishlist(product._id) ? "heart" : "heart-outline"}
              size={24}
              color={isInWishlist(product._id) ? "#121212" : "#FFFFFF"}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* IMAGE GALLERY */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {product.images.map((image: string, index: number) => (
              <View key={index} style={{ width }}>
                <Image
                  source={image}
                  style={{ width, height: 400 }}
                  contentFit="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* Image Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {product.images.map((_: any, index: number) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === selectedImageIndex
                    ? "bg-primary w-6"
                    : "bg-white/50 w-2"
                }`}
              />
            ))}
          </View>
        </View>

        {/* PRODUCT INFO */}
        <View className="p-6">
          {/* Category */}
          <View className="flex-row items-center mb-3">
            <View className="bg-primary/20 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-bold">
                {product.category}
              </Text>
            </View>
          </View>
          {/* Product Name */}
          <Text className="text-text-primary text-3xl font-bold mb-3">
            {product.name}
          </Text>
          {/* Rating & Reviews */}
          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-surface px-3 py-2 rounded-full">
              <Ionicons name="star" size={16} color="#FFC107" />
              <Text className="text-text-primary font-bold ml-1 mr-2">
                {product.averageRating.toFixed(1)}
              </Text>
              <Text className="text-text-secondary text-sm">
                ({product.totalReviews} reviews)
              </Text>
            </View>
            {inStock ? (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-500 font-semibold text-sm">
                  {product.stock} in stock
                </Text>
              </View>
            ) : (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                <Text className="text-red-500 font-semibold text-sm">
                  Out of Stock
                </Text>
              </View>
            )}
          </View>
          {/* Price */}
          <View className="flex-row items-center mb-6">
            <Text className="text-primary text-4xl font-bold">
              ₹{product.price.toFixed(2)}
            </Text>
          </View>
          {/* Quantity */}
          <View className="mb-6">
            <Text className="text-text-primary text-lg font-bold mb-3">
              Quantity
            </Text>

            <View className="flex-row items-center">
              <TouchableOpacity
                className="bg-surface rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                activeOpacity={0.7}
                disabled={!inStock}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={inStock ? "#FFFFFF" : "#666"}
                />
              </TouchableOpacity>

              <Text className="text-text-primary text-xl font-bold mx-6">
                {quantity}
              </Text>

              <TouchableOpacity
                className="bg-primary rounded-full w-12 h-12 items-center justify-center"
                onPress={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                activeOpacity={0.7}
                disabled={!inStock || quantity >= product.stock}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={
                    !inStock || quantity >= product.stock ? "#666" : "#121212"
                  }
                />
              </TouchableOpacity>
            </View>

            {quantity >= product.stock && inStock && (
              <Text className="text-orange-500 text-sm mt-2">
                Maximum stock reached
              </Text>
            )}
          </View>
          {/* Description */}
          <View className="mb-8">
            <Text className="text-text-primary text-lg font-bold mb-3">
              Description
            </Text>
            <Text className="text-text-secondary text-base leading-6">
              {product.description}
            </Text>
          </View>
          {/* AI SUMMARY BUTTON — add this inside ScrollView, after Description */}
          <TouchableOpacity
            className="flex-row items-center justify-center bg-surface border border-primary/30 rounded-2xl py-4 mb-8"
            onPress={handleAISummary}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={20} color="#00D9FF" />
            <Text className="text-primary font-bold text-base ml-2">
              AI Summary
            </Text>
          </TouchableOpacity>

          {/* REVIEWS SECTION */}
          <View className="mb-8">
            <Text className="text-text-primary text-lg font-bold mb-4">
              Customer Reviews
            </Text>

            {isReviewsLoading ? (
              <ActivityIndicator size="small" color="#00D9FF" />
            ) : reviews && reviews.length > 0 ? (
              <>
                {/* sentiment bar above review cards */}
                <SentimentBar reviews={reviews} />

                {reviews.map((review) => (
                  <View
                    key={review._id}
                    className="bg-surface rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-text-primary font-semibold">
                        {review.user.name}
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>

                    <View className="flex-row items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={14}
                          color="#FFC107"
                        />
                      ))}
                      {/* sentiment badge next to stars */}
                      {review.sentiment?.label &&
                        review.sentiment.label !== "none" && (
                          <View
                            className={`ml-2 px-2 py-0.5 rounded-full ${
                              review.sentiment.label === "positive"
                                ? "bg-green-400/20"
                                : review.sentiment.label === "negative"
                                  ? "bg-red-400/20"
                                  : "bg-yellow-400/20"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                review.sentiment.label === "positive"
                                  ? "text-green-400"
                                  : review.sentiment.label === "negative"
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {review.sentiment.label}
                            </Text>
                          </View>
                        )}
                    </View>

                    {review.comment ? (
                      <Text className="text-text-secondary text-sm leading-5">
                        {review.comment}
                      </Text>
                    ) : (
                      <Text className="text-text-secondary text-xs italic">
                        No comment left
                      </Text>
                    )}
                  </View>
                ))}
              </>
            ) : (
              <View className="bg-surface rounded-2xl p-4 items-center">
                <Text className="text-text-secondary text-sm">
                  No reviews yet. Be the first to review!
                </Text>
              </View>
            )}
          </View>
          {/* AI SUMMARY MODAL */}
          <Modal
            visible={summaryModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSummaryModalVisible(false)}
          >
            <Pressable
              className="flex-1 bg-black/60 justify-end"
              onPress={() => setSummaryModalVisible(false)}
            >
              <Pressable onPress={() => {}}>
                <View className="bg-background rounded-t-3xl p-6 pb-10">
                  {/* Modal Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                      <Ionicons name="sparkles" size={22} color="#00D9FF" />
                      <Text className="text-text-primary text-xl font-bold ml-2">
                        AI Product Description
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSummaryModalVisible(false)}
                      className="bg-surface w-9 h-9 rounded-full items-center justify-center"
                    >
                      <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Product name inside modal */}
                  <Text className="text-text-secondary text-sm mb-4">
                    {product.name}
                  </Text>

                  {/* Divider */}
                  <View className="h-px bg-surface mb-4" />

                  {/* Content */}
                  {isSummaryLoading ? (
                    <View className="flex-row items-center py-6">
                      <ActivityIndicator size="small" color="#00D9FF" />
                      <Text className="text-text-secondary ml-3">
                        Generating AI summary...
                      </Text>
                    </View>
                  ) : summary ? (
                    <Text className="text-text-secondary text-base leading-7">
                      {summary}
                    </Text>
                  ) : (
                    <View className="items-center py-6">
                      <Text className="text-text-secondary text-sm">
                        Failed to generate summary. Try again.
                      </Text>
                      <TouchableOpacity
                        className="mt-4 bg-primary/20 px-6 py-3 rounded-xl"
                        onPress={() => refetch()}
                      >
                        <Text className="text-primary font-semibold">
                          Retry
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-surface px-6 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-text-secondary text-sm mb-1">
              Total Price
            </Text>
            <Text className="text-primary text-2xl font-bold">
              ₹{(product.price * quantity).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-2xl px-8 py-4 flex-row items-center ${
              !inStock ? "bg-surface" : "bg-primary"
            }`}
            activeOpacity={0.8}
            onPress={handleAddToCart}
            disabled={!inStock || isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <Ionicons
                  name="cart"
                  size={24}
                  color={!inStock ? "#666" : "#121212"}
                />
                <Text
                  className={`font-bold text-lg ml-2 ${
                    !inStock ? "text-text-secondary" : "text-background"
                  }`}
                >
                  {!inStock ? "Out of Stock" : "Add to Cart"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
};

export default ProductDetailScreen;

function ErrorUI() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text className="text-text-primary font-semibold text-xl mt-4">
          Product not found
        </Text>
        <Text className="text-text-secondary text-center mt-2">
          This product may have been removed or doesn&apos;t exist
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-2xl px-6 py-3 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-background font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

function LoadingUI() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text className="text-text-secondary mt-4">Loading product...</Text>
      </View>
    </SafeScreen>
  );
}
function SentimentBar({ reviews }: { reviews: ProductReview[] }) {
  const withSentiment = reviews.filter(
    (r) => r.sentiment?.label && r.sentiment.label !== "none",
  );

  if (withSentiment.length === 0) return null;

  const total = withSentiment.length;
  const positive = Math.round(
    (withSentiment.filter((r) => r.sentiment.label === "positive").length /
      total) *
      100,
  );
  const neutral = Math.round(
    (withSentiment.filter((r) => r.sentiment.label === "neutral").length /
      total) *
      100,
  );
  const negative = Math.round(
    (withSentiment.filter((r) => r.sentiment.label === "negative").length /
      total) *
      100,
  );

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <Text className="text-text-primary font-bold mb-3">
        Sentiment Analysis
      </Text>

      {/* Positive */}
      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-green-400 text-xs font-semibold">Positive</Text>
          <Text className="text-green-400 text-xs font-semibold">
            {positive}%
          </Text>
        </View>
        <View className="bg-background rounded-full h-2">
          <View
            className="bg-green-400 h-2 rounded-full"
            style={{ width: `${positive}%` }}
          />
        </View>
      </View>

      {/* Neutral */}
      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-yellow-400 text-xs font-semibold">Neutral</Text>
          <Text className="text-yellow-400 text-xs font-semibold">
            {neutral}%
          </Text>
        </View>
        <View className="bg-background rounded-full h-2">
          <View
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${neutral}%` }}
          />
        </View>
      </View>

      {/* Negative */}
      <View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-red-400 text-xs font-semibold">Negative</Text>
          <Text className="text-red-400 text-xs font-semibold">
            {negative}%
          </Text>
        </View>
        <View className="bg-background rounded-full h-2">
          <View
            className="bg-red-400 h-2 rounded-full"
            style={{ width: `${negative}%` }}
          />
        </View>
      </View>

      <Text className="text-text-secondary text-xs mt-3">
        Based on {total} comment{total > 1 ? "s" : ""}
      </Text>
    </View>
  );
}
