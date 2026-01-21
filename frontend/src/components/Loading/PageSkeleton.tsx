export const PageSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Title placeholder */}
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>

      {/* Content placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar or secondary content */}
        <div className="hidden md:block col-span-1 space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>

        {/* Main content */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
