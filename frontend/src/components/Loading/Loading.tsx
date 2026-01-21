export const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-600 animate-ping opacity-20"></div>
      </div>
    </div>
  );
};
