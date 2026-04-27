import { View, ActivityIndicator } from "react-native";

export default function SSOCallback() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#4285f4" />
    </View>
  );
}
