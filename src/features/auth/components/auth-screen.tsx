"use client";

import { useState } from "react";

import { SignInFlow } from "../types";
import SignInCard from "./sign-in-card";
import SignUpCard from "./sign-up-card";

export const AuthScreen = () => {
    const [state , setState ] = useState<SignInFlow>("signIn");

    return (
        <div className="h-full flex items-center justify-around">
            <div className="flex flex-col items-center justify-around w-[800px] h-[600px]">
                <div className="h-[400px] w-full text-center">
                    Where you organise
                </div>
                <div className="w-full">
                    <video className="rounded-lg" autoPlay loop muted playsInline >
                        <source src="https://res.cloudinary.com/dhpftsqpt/video/upload/v1741602268/h1gowttvfk5tyxlwukfr.webm" type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
            <div className="h-[600px] w-[600px] md:w-[420px]">
                {state === "signIn"? <SignInCard setState= {setState} /> : <SignUpCard setState= {setState} />}
            </div>
         </div>
    );
};