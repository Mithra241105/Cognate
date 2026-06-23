"use client";

import { useRef, useState } from "react";

interface OTPInputProps {
    /** Callback fired once all four digit slots are filled. */
    onComplete: (fullOtp: string) => void;
}

/**
 * Four-slot OTP input with automatic focus advancement and backspace handling.
 *
 * Each slot accepts a single numeric character. Focus advances to the next
 * slot on valid input and retreats to the previous slot on Backspace when
 * the current slot is already empty.
 */
export default function OTPInput({ onComplete }: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
    const refs          = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null)
    ];

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]$/.test(value) && value !== "") return;

        const newOtp  = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value !== "" && index < 3) {
            refs[index + 1].current?.focus();
        }

        if (newOtp.every((d) => d !== "")) {
            onComplete(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            refs[index - 1].current?.focus();
        }
    };

    return (
        <div className="flex gap-4 justify-center my-6">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={refs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-16 text-center text-2xl font-bold rounded-xl bg-neo shadow-neo-concave focus:shadow-neo-convex focus:outline-none transition-all duration-200 text-[#8a5cff] caret-[#8a5cff]"
                />
            ))}
        </div>
    );
}
