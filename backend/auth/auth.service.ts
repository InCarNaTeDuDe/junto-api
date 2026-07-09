import { runInTransaction } from "../db/transaction";

import { GoogleLoginSchema } from "./auth.schema";
import { verifyGoogleToken } from "./google.service";
import { User } from "../db/entities/User.entity";
import { DeviceSession } from "../db/entities/DeviceSession.entity";
import { LoginHistory } from "../db/entities/LoginHistory.entity";
import { AuditLog } from "../db/entities/AuditLog.entity";
import { generateAccessToken } from "./jwt.service";

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
