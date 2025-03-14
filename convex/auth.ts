import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { DataModel } from "./_generated/dataModel";
import { ResendOTPPasswordReset } from "./passwordReset/ResendOTPPasswordReset";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [CustomPassword, GitHub, Google, Password({ id: "password-with-reset", reset: ResendOTPPasswordReset })],
});
