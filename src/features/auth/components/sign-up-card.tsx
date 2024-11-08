import { useAuthActions } from "@convex-dev/auth/react";
import { TriangleAlert } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";

import { SignInFlow } from "../types";
import { Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface SignUpCardProps {
    setState: (state: SignInFlow) => void,
}

const SignUpCard: React.FC<SignUpCardProps> = ({
    setState,
}) => {
    const { signIn } = useAuthActions();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    const handleProverSignUp = (value: "github" | "google") => {
        setPending(true);
        signIn(value)
            .finally(() => {
                setPending(false);
            });
    }
    
    const onPasswordSignUp = ( e: React.FormEvent<HTMLElement>) => {
        e.preventDefault();
        
        if( password !== confirmPassword ){
            setError("Password does not match");
            return;
        }
        
        setPending(true);
        signIn("password", { name, email , password, flow: "signUp" })
            .catch(() => {
                setError("Something went wrong")
            })
            .finally(() => {
                setPending(false);
            })
    }

    return ( 
        <Card className="w-full h-full p-8">
            <CardHeader className="px-0 pt-0">
                <CardTitle>
                    Sign up to Continue
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
            <CardContent className="space-y-5 px-0 pb-0">
                <form onSubmit = {onPasswordSignUp} className="space-y-2.5">
                    <Input
                        disabled={pending}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        type="name"
                        required
                    />
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
                    <Input
                        disabled={pending}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        type="password"
                        required
                    />
                    <Button 
                        disabled={pending}
                        type="submit" 
                        className="w-full" 
                        size="lg"
                    >
                        Continue
                    </Button>
                </form>
                <Separator />
                <div className="flex flex-col gap-y-2.5">
                    <Button
                        disabled={pending}
                        onClick={() => handleProverSignUp("google")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FcGoogle className="absolute size-5 top-3.5 left-2.5"/>
                        Continue with Google
                    </Button>
                    <Button
                        disabled={pending}
                        onClick={() => handleProverSignUp("github")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FaGithub className="absolute size-5 top-3.5 left-2.5"/>
                        Continue with Github
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Already have an account? <span onClick={() => setState("signIn")} className="text-sky-900 hover:underline cursor-pointer">Sign in</span>
                </p>
            </CardContent>
        </Card>
    );
}
 
export default SignUpCard;