"use client";

import { useState } from "react";

import { SignInFlow } from "../types";
import SignInCard from "./sign-in-card";
import SignUpCard from "./sign-up-card";
import PasswordReset from "./PasswordReset";

export const AuthScreen = () => {
    const [state , setState ] = useState<SignInFlow>("signIn");

    return (
        <div className="h-full flex items-center justify-around bg-[#fafafa]">
            <div className="m-4 hidden lg:flex flex-col items-center justify-around w-[800px] h-[600px]">
                <div className="h-[400px] w-full text-[50px] text-[#3f3f46] text-center">
                    Where <span className="inline-block text-[#09090b]">Work</span> Happens
                </div>
                <div className="justify-self-end w-full"> 
                    <video className="rounded-lg" autoPlay loop muted playsInline >
                        <source src="https://res.cloudinary.com/dhpftsqpt/video/upload/v1741602268/h1gowttvfk5tyxlwukfr.webm" type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
            <div className="m-4 h-[600px] w-[600px] lg:w-[420px]">
            {state === "signIn" ? (
                <SignInCard setState={setState} />
                ) : state === "signUp" ? (
                <SignUpCard setState={setState} />
                ) : state === "forgot" ? (
                <PasswordReset setState={setState} />
                ) : null
            }
            </div>
         </div>
    );
};