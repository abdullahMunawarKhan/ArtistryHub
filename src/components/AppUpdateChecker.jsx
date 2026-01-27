import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { fetchLatestAppVersion, isVersionLower } from "../utils/appVersion";

export default function AppUpdateChecker() {
  const [show, setShow] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function checkUpdate() {
      try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        const latest = await fetchLatestAppVersion();
        if (!latest) return;

        if (isVersionLower(currentVersion, latest.version_no)) {
          setUpdateInfo(latest);
          setTimeout(() => setShow(true), 2500);
        }
      } catch (err) {
        console.error("Update check failed", err);
      }
    }

    checkUpdate();
  }, []);

  if (!show || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center shadow-xl">
        <h2 className="text-lg font-bold mb-2">
          {updateInfo.force_update ? "Update Required" : "Update Available"}
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          {updateInfo.force_update
            ? "You must update the app to continue using it."
            : "A new version is available with improvements."}
        </p>

        <a
          href={updateInfo.version_url}
          className="block w-full py-3 rounded-lg bg-purple-600 text-white font-semibold"
        >
          Download Update
        </a>

        {!updateInfo.force_update && (
          <button
            onClick={() => setShow(false)}
            className="mt-3 text-sm text-gray-500"
          >
            Later
          </button>
        )}
      </div>
    </div>
  );
}
