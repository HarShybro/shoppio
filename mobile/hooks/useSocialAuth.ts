// import { useSSO } from "@clerk/expo";
// import { useState } from "react";
// import { Alert } from "react-native";

// function useSocialAuth() {
//   const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
//   const { startSSOFlow } = useSSO();

//   const handleSocialAuth = async (strategy: "oauth_google") => {
//     setLoadingStrategy(strategy);

//     try {
//       const { createdSessionId, setActive } = await startSSOFlow({ strategy });
//       if (createdSessionId && setActive) {
//         await setActive({ session: createdSessionId });
//       }
//     } catch (error) {
//       console.log("💥 Error in social auth:", error);

//       Alert.alert(
//         "Error",
//         `Failed to sign in with ${strategy}. Please try again.`,
//       );
//     } finally {
//       setLoadingStrategy(null);
//     }
//   };

//   return { loadingStrategy, handleSocialAuth };
// }

// export default useSocialAuth;

import { useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

function useSocialAuth() {
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google") => {
    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/(auth)/sso-callback"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error) {
      console.log("💥 Error in social auth:", error);
      Alert.alert(
        "Error",
        `Failed to sign in with ${strategy}. Please try again.`,
      );
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { loadingStrategy, handleSocialAuth };
}

export default useSocialAuth;
