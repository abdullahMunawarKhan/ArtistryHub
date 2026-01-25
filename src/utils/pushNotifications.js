import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

/**
 * Register device for FCM and save token to Supabase
 */
export async function registerForPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1️⃣ Ask permission
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      console.log("Push permission not granted");
      return;
    }

    // 2️⃣ Register with FCM
    await PushNotifications.register();

    // 3️⃣ On successful registration
    PushNotifications.addListener("registration", async (token) => {
      console.log("FCM token:", token.value);

      // Save token to Supabase
      await supabase.from("push_tokens").upsert({
        token: token.value,
        platform: "android"
      });
    });

    // 4️⃣ Handle errors
    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

  } catch (err) {
    console.error("Push setup failed", err);
  }
}
