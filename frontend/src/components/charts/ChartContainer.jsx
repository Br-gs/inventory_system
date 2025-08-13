export const ChartContainer = ({ children, height = '400px' }) => (
    <div style={{ position: 'relative', height }}>
        {children}
    </div>
);