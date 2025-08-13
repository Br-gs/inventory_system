export const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
        </div>
    </div>
);