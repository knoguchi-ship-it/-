import React from 'react';

export const SkeletonRow = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse flex flex-col md:flex-row gap-4 items-start md:items-center">
    <div className="flex-1 space-y-2 w-full">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="w-full md:w-32 h-8 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);