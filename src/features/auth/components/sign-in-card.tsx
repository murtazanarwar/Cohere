import { useAuthActions } from "@convex-dev/auth/react";
import { TriangleAlert } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";

import { Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SignInFlow } from "../types";

interface SignInCardProps {
    setState: (state: SignInFlow) => void,
}

const SignInCard: React.FC<SignInCardProps> = ({
    setState,
}) => {
    const { signIn } = useAuthActions();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    const handleProverSignIn = (value: "github" | "google") => {
        setPending(true);
        signIn(value)
            .finally(() => {
                setPending(false);
            });
    }

    const onPasswordSignIn = ( e: React.FormEvent<HTMLElement>) => {
        e.preventDefault();
        setPending(true);

        signIn("password", { email , password, flow: "signIn" })
            .catch(() => {
                setError("Invalid email or password")
            })
            .finally(() => {
                setPending(false);
            })
    }
  
    return ( 
        <Card className="w-full h-full p-12 space-y-4" style={{ borderColor: "#0c1e2b" }}>
            <CardHeader className="px-0 pt-0">
                <CardTitle>
                    Login to Continue
                </CardTitle>
                <CardDescription>
                    Use your email or another service to continue
                </CardDescription>
            </CardHeader>
            {!!error && (
                <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-6">
                  <TriangleAlert className="size-4" /> 
                  <p>{error}</p> 
                </div>
            )}
            <CardContent className="space-y-8 px-0 pb-0">
                <form onSubmit={onPasswordSignIn} className="space-y-3">
                    <Input
                        disabled={pending}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        required
                    />
                    <Input
                        disabled={pending}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        required
                    />
                    <p className="text-xs text-end text-sky-900 hover:underline cursor-pointer" onClick={() => setState("forgot")} >
                        Forgot Password?
                    </p>
                    <Button 
                        disabled={pending}
                        type="submit" 
                        className="bg-[#132e43] hover:bg-[#204864] w-full"
                        size="lg"
                    >
                        Continue
                    </Button>
                </form>
                <Separator />
                <div className="flex flex-col gap-y-5">
                    <Button
                        disabled={pending}
                        onClick={() => handleProverSignIn("google")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FcGoogle className="absolute size-5 top-3.5 left-2.5"/>
                        Continue with Google
                    </Button>
                    <Button
                        disabled={pending}
                        onClick={() => handleProverSignIn("github")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FaGithub className="absolute size-5 top-3.5 left-2.5"/>
                        Continue with Github
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Don&apos;t have an account? <span onClick={() => setState("signUp")} className="text-sky-900 hover:underline cursor-pointer">Sign up</span>
                </p>
            </CardContent>
        </Card>
    );
}
 
export default SignInCard;