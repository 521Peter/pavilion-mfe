import { useEffect, useState } from "react";
import { getProfile, type UserProfile } from "../api/auth";
import { getToken } from "../api/http";

export type ProfileResource =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: UserProfile };

const profilePromises = new Map<string, Promise<UserProfile>>();

export function useProfile(): ProfileResource {
  const token = getToken();
  const [resource, setResource] = useState<ProfileResource>({ status: "loading" });

  useEffect(() => {
    if (!token) return;

    let active = true;
    let profilePromise = profilePromises.get(token);
    if (!profilePromise) {
      profilePromise = getProfile();
      profilePromises.set(token, profilePromise);
      profilePromise.catch(() => profilePromises.delete(token));
    }

    profilePromise
      .then(profile => {
        if (!active) return;
        setResource({ status: "ready", profile });
        return undefined;
      })
      .catch(error => {
        if (!active) return;
        setResource({ status: "error", message: error instanceof Error ? error.message : "加载失败" });
        return undefined;
      });

    return () => {
      active = false;
    };
  }, [token]);

  return resource;
}
