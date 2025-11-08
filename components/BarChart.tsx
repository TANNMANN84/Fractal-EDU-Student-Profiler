
import React from 'react';

interface BarChartData {
    label: string;
    value: number;
    color: string;
}

interface BarChartProps {
    data: BarChartData[];
    onBarClick?: (label: string) => void;
}

const BarChart: React.FC<BarChartProps> = ({ data, onBarClick }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="w-full bg-gray-50 p-4 rounded-lg border">
            <div className="space-y-2">
                {data.map(item => {
                    const barWidthPercent = (item.value / maxValue) * 100;
                    // Show value inside if bar is wide enough, otherwise outside
                    const showValueInside = barWidthPercent > 12;

                    return (
                        <div
                            key={item.label}
                            className="flex items-center gap-3 text-sm group rounded-md p-1 -m-1 hover:bg-gray-100 cursor-pointer"
                            onClick={() => onBarClick?.(item.label)}
                        >
                            <div className="w-44 text-right text-gray-600 truncate group-hover:text-blue-600" title={item.label}>
                                {item.label}
                            </div>
                            <div className="flex-1 flex items-center">
                                <div className="flex-1 bg-gray-200 rounded-md h-6 relative group-hover:opacity-90 transition-opacity">
                                    <div
                                        className="h-6 rounded-md flex items-center justify-end pr-2 transition-all duration-500 ease-out"
                                        style={{
                                            width: `${barWidthPercent}%`,
                                            backgroundColor: item.color,
                                        }}
                                    >
                                        {showValueInside && (
                                            <span className="font-bold text-white">
                                                {item.value}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!showValueInside && (
                                    <span className="ml-2 font-bold text-gray-700">
                                        {item.value}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BarChart;
