import { runInTransaction } from "../db/transaction";

import { GoogleLoginSchema } from "./auth.schema";
import { verifyGoogleToken } from "./google.service";
import { User } from "../entities/User.entity";
import { DeviceSession } from "../entities/DeviceSession.entity";
import { LoginHistory } from "../entities/LoginHistory.entity";
import { AuditLog } from "../entities/AuditLog.entity";
import { generateAccessToken } from "./jwt.service";
import { userRepository } from "../repositories/User.repository";
import { activityRepository } from "../repositories/Activity.repository";
import { ticketRepository } from "../repositories/Ticket.repository";

export async function loginWithGoogle(
  request: GoogleLoginSchema,
  ipAddress: string,
) {
  const googleUser = await verifyGoogleToken(request.idToken);

  try {
    return runInTransaction(async (manager) => {
      // clean repositories inside transaction
      const userRepo = manager.getRepository(User);
      const deviceRepo = manager.getRepository(DeviceSession);
      const loginRepo = manager.getRepository(LoginHistory);
      const auditRepo = manager.getRepository(AuditLog);

      // ======================
      // USER UPSERT
      // ======================
      let user = await userRepo.findOne({
        where: { email: googleUser.email },
      });

      console.log("User from db", user);

      if (!user) {
        const userHandle =
          `${googleUser.name.split(" ")[0]}_${googleUser.email.split("@")[0]}`
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "");

        user = userRepo.create({
          email: googleUser.email,
          name: googleUser.name,
          userHandle,
          avatar: googleUser.picture,
          identityVerified: true,
          rating: 5,
          walletBalance: 0,
          lastLogin: new Date(),
        });

        await userRepo.save(user);
        console.log("✅ New user saved:", {
          id: user.id,
          email: user.email,
          userHandle: user.userHandle,
          pushToken: user.pushToken,
        });
      } else {
        user.lastLogin = new Date();
        user.avatar = googleUser.picture;
        await userRepo.save(user);
      }

      // ======================
      // DEVICE UPSERT
      // ======================
      const device = request.device;

      if (device) {
        const existing = await deviceRepo.findOne({
          where: {
            userId: user.id,
            deviceId: device.deviceId,
          },
        });

        if (!existing) {
          await deviceRepo.save({
            userId: user.id,
            deviceId: device.deviceId,
            platform: device.platform,
            deviceName: device.deviceName,
            model: device.model,
            os: device.operatingSystem,
            appVersion: device.appVersion,
            ipAddress,
            isActive: true,
          });
        }
      }

      // ======================
      // LOGIN HISTORY
      // ======================
      await loginRepo.save({
        userId: user.id,
        method: "GOOGLE_SSO",
        platform: device?.platform ?? "UNKNOWN",
        ipAddress,
        success: true,
      });

      // ======================
      // AUDIT LOG
      // ======================
      await auditRepo.save({
        userId: user.id,
        action: "GOOGLE_LOGIN_SUCCESS",
        details: `Login via ${device?.platform}`,
        timestamp: new Date(),
      });

      // ======================
      // RETURN
      // ======================
      return {
        user,
        accessToken: generateAccessToken(user),
        expiresIn: 60 * 60 * 24 * 7,
      };
    });
  } catch (error) {
    console.error("Failed to save the user in db", error);
  }
}

export async function getCurrentUser(userId: string) {
  try {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found.");
    return user;
  } catch (error) {
    console.log("auth.service.ts [getCurrentUser] failed:", error);
    return null;
  }
}

export async function getUserProfile(currentUser: any) {
  try {
    const userId =
      typeof currentUser === "string"
        ? currentUser
        : currentUser?.id || currentUser?.sub || "";

    const dbUser = await userRepository.findById(userId);
    const user = {
      ...(typeof currentUser === "object" ? currentUser : {}),
      ...(dbUser || {}),
    };

    const userActivities = await activityRepository.findUserActivities(
      userId,
      user.email,
      user.name,
    );

    const activitiesGrouped: Record<string, any[]> = {
      ASK_NEARBY: [],
      MOVIES: [],
      DAY_MATES: [],
    };

    for (const act of userActivities || []) {
      const cat = String(act.category || "").toUpperCase();
      if (cat.includes("MOVIE") || cat.includes("TICKET")) {
        activitiesGrouped.MOVIES.push(act);
      } else if (
        cat.includes("ASK") ||
        cat.includes("NEARBY") ||
        cat.includes("LOST")
      ) {
        activitiesGrouped.ASK_NEARBY.push(act);
      } else if (cat.includes("DAY") || cat.includes("MATE")) {
        activitiesGrouped.DAY_MATES.push(act);
      } else {
        (activitiesGrouped[cat] ||= []).push(act);
      }
    }

    const directTicketsCount = await ticketRepository.countUserTickets(userId);

    return {
      ...user,
      userHandle: user.userHandle,
      createdActivitiesCount: userActivities.length,
      ticketsCount: activitiesGrouped.MOVIES.length + directTicketsCount,
      activities: activitiesGrouped,
    };
  } catch (error) {
    console.log("auth.service.ts [getUserProfile] error:", error);
    return {
      ...currentUser,
      userHandle: currentUser?.userHandle,
      createdActivitiesCount: 0,
      ticketsCount: 0,
      activities: { ASK_NEARBY: [], MOVIES: [], DAY_MATES: [] },
    };
  }
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; avatar?: string; userHandle?: string },
) {
  return userRepository.updateUser(userId, data);
}
