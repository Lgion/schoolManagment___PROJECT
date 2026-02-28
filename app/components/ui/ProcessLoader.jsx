"use client";
import React from 'react';

const ProcessLoader = ({ message = "Traitement en cours...", rows = 5 }) => {
    return (
        <div className="process-loader">
            <div className="process-loader__shimmer-block process-loader__shimmer-block--title"></div>

            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="process-loader__shimmer-block process-loader__shimmer-block--row" style={{ opacity: 1 - (index * 0.15) }}></div>
            ))}

            <div className="process-loader__text">
                {message}
            </div>
        </div>
    );
};

export default ProcessLoader;
