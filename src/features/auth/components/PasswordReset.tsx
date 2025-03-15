import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { SignInFlow } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PasswordResetProps {
  setState: (state: SignInFlow) => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ setState }) => {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");

  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try{
      const result = await signIn("password", formData);
      setStep({ email: formData.get("email") as string });
    } catch(error){
      toast.message("This feature is still in development. Please check back later! ⏳😊");
    }
  };

  const handleResetSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await signIn("password", formData);
    setState("signIn");
  };

  return (
    <Card className="w-full h-full pl-12 pr-12 pt-8 space-y-2.5" style={{ borderColor: "#611F69" }}>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {step === "forgot"
            ? "Enter your email to receive a reset code."
            : "Enter the code and set your new password."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        {step === "forgot" ? (
          <form onSubmit={handleForgotSubmit} className="space-y-2.5">
            <Input 
              name="email" 
              placeholder="Email" 
              type="email" 
              required 
            />
            <input 
              name="flow" 
              type="hidden" 
              value="reset"
            />
            
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-[#4A154B] hover:bg-[#611f69]">
                Send Code
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setState("signIn")}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-2.5">
            <Input 
              name="code" 
              placeholder="Code" 
              type="text" 
              required 
            />
            <Input 
              name="newPassword" 
              placeholder="New Password" 
              type="password" 
              required 
            />
            <input name="email" value={step.email} type="hidden" />
            <input name="flow" type="hidden" value="reset-verification" />
            
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-[#4A154B] hover:bg-[#611f69]">
                Continue
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setState("signIn")}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordReset;