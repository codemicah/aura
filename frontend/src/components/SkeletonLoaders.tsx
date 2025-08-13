'use client';

export function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-700 rounded w-2/3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-24"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-700 rounded w-20"></div>
          <div className="h-10 bg-gray-700 rounded w-20"></div>
          <div className="h-10 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div className="h-96 bg-gray-700 rounded"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-700 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-16 ml-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPortfolioOverview() {
  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      
      {/* Chart */}
      <SkeletonChart />
      
      {/* Protocol Allocation */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-3">
              <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-600 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonInvestmentForm() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
      
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
        
        <div>
          <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-700 rounded"></div>
          ))}
        </div>
        
        <div className="h-12 bg-gray-700 rounded mt-6"></div>
      </div>
    </div>
  );
}