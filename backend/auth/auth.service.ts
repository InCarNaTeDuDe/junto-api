import { runInTransaction } from "../db/transaction";

import { GoogleLoginSchema } from "./auth.schema";
import { verifyGoogleToken } from "./google.service";
import { User } from "../db/entities/User.entity";
import { DeviceSession } from "../db/entities/DeviceSession.entity";
import { LoginHistory } from "../db/entities/LoginHistory.entity";
import { AuditLog } from "../db/entities/AuditLog.entity";
import { generateAccessToken } from "./jwt.service";
import { userRepository } from "../db/repository/User.repository";
import { activityRepository } from "../db/repository/Activity.repository";
import { ticketRepository } from "../db/repository/Ticket.repository";

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
        user = userRepo.create({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          identityVerified: true,
          rating: 5,
          walletBalance: 0,
          lastLogin: new Date(),
        });

        await userRepo.save(user);
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
        : currentUser?.id ||
          currentUser?.userId ||
          currentUser?.sub ||
          currentUser?._id ||
          "";

    const userEmail =
      typeof currentUser === "object" ? currentUser?.email : undefined;
    const userName =
      typeof currentUser === "object" ? currentUser?.name : undefined;

    const userActivities = await activityRepository.findUserActivities(
      userId,
      userEmail,
      userName,
    );

    const activitiesGrouped: Record<string, any[]> = {
      ASK_NEARBY: [],
      MOVIES: [],
      DAY_MATES: [],
    };

    for (const act of userActivities || []) {
      const cat = String(act.category || "").toUpperCase();
      if (cat === "MOVIES" || cat.includes("MOVIE") || cat.includes("TICKET")) {
        activitiesGrouped.MOVIES.push(act);
      } else if (
        cat === "ASK_NEARBY" ||
        cat.includes("ASK") ||
        cat.includes("NEARBY") ||
        cat.includes("LOST")
      ) {
        activitiesGrouped.ASK_NEARBY.push(act);
      } else if (
        cat === "DAY_MATES" ||
        cat.includes("DAY") ||
        cat.includes("MATE")
      ) {
        activitiesGrouped.DAY_MATES.push(act);
      } else {
        if (!activitiesGrouped[cat]) {
          activitiesGrouped[cat] = [];
        }
        activitiesGrouped[cat].push(act);
      }
    }

    const totalActivitiesCount = userActivities.length;
    const directTicketsCount = await ticketRepository.countUserTickets(userId);
    const ticketsCount = activitiesGrouped.MOVIES.length + directTicketsCount;

    return {
      ...currentUser,
      createdActivitiesCount: totalActivitiesCount,
      ticketsCount: ticketsCount,
      activities: activitiesGrouped,
    };
  } catch (error) {
    console.log("auth.service.ts [getUserProfile] error:", error);
    return {
      ...currentUser,
      createdActivitiesCount: 0,
      ticketsCount: 0,
      activities: {
        ASK_NEARBY: [],
        MOVIES: [],
        DAY_MATES: [],
      },
    };
  }
}
