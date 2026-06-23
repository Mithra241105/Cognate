import React, { ReactNode } from "react";

interface NeumorphicCardProps {
    children: ReactNode;
}

const NeumorphicCard = ({ children }: NeumorphicCardProps) => {
    return (
        
        <div className="neo-container p-8 max-w-md w-full">
            {children}
        </div>
        
    );
}

export default NeumorphicCard;
