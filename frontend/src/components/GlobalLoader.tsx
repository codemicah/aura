"use client";
import React from "react";
import { useLoading } from "../hooks/useLoading";

const GlobalLoader: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <span className="text-xl font-semibold text-gray-700">Loading...</span>
      </div>
    </div>
  );
};

export default GlobalLoader;
