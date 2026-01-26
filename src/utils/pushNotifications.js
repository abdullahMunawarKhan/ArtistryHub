import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

/**
 * Register device for FCM and save token to Supabase
 */
export async function registerForPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1️⃣ Check/Request permission
    let permissionStatus = await PushNotifications.checkPermissions();

    if (permissionStatus.receive === 'prompt') {
      permissionStatus = await PushNotifications.requestPermissions();
    }

    if (permissionStatus.receive !== "granted") {
      console.log("Push notification permission dismissed/denied");
      return;
    }

    // 2️⃣ Register with FCM
    await PushNotifications.register();

    // 3️⃣ On successful registration
    PushNotifications.addListener("registration", async (token) => {
      console.log("FCM token successfully registered:", token.value);

      // Save token to Supabase
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("push_tokens").upsert({
        token: token.value,
        platform: Capacitor.getPlatform(),
        user_id: user?.id || null, // Associate with user if logged in
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });

      if (error) console.error("Error saving token to Supabase:", error);
    });

    // 4️⃣ Handle errors
    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    // 5️⃣ Listen to incoming notifications while app is open
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push received:", notification);
    });

  } catch (err) {
    console.error("Push setup failed", err);
  }
}
