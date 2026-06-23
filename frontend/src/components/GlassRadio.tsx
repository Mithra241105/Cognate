import React from "react";
import "./GlassRadio.css";

interface GlassRadioProps {
    selectedValue: string;
    onChange: (value: string) => void;
}

export default function GlassRadio({ selectedValue, onChange }: GlassRadioProps) {
    return (
        <div className="radio-input">
            <div className="glass">
                <div className="glass-inner"></div>
            </div>
            <div className="selector">
                <div className="choice">
                    <div>
                        <input
                            className="choice-circle"
                            checked={selectedValue === "All"}
                            onChange={() => onChange("All")}
                            value="All"
                            name="number-selector"
                            id="one"
                            type="radio"
                        />
                        <div className="ball"></div>
                    </div>
                    <label htmlFor="one" className="choice-name">All</label>
                </div>
                <div className="choice">
                    <div>
                        <input
                            className="choice-circle"
                            checked={selectedValue === "Sci"}
                            onChange={() => onChange("Sci")}
                            value="Sci"
                            name="number-selector"
                            id="two"
                            type="radio"
                        />
                        <div className="ball"></div>
                    </div>
                    <label htmlFor="two" className="choice-name">Sci</label>
                </div>
                <div className="choice">
                    <div>
                        <input
                            className="choice-circle"
                            checked={selectedValue === "Math"}
                            onChange={() => onChange("Math")}
                            value="Math"
                            name="number-selector"
                            id="three"
                            type="radio"
                        />
                        <div className="ball"></div>
                    </div>
                    <label htmlFor="three" className="choice-name">Math</label>
                </div>
            </div>
        </div>
    );
}
