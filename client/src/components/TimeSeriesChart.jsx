import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatNumber, formatTimestamp } from '../utils/helpers';

const TimeSeriesChart = ({ sensorData, title, sensorType, color, unit }) => {
  const canvasRef = useRef(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [tooltip, setTooltip] = useState(null);

  const timeRanges = ['1h', '6h', '24h', '7d'];

  // Process data for the specific sensor type - show all original data points
  const getProcessedData = useCallback(() => {
    if (!sensorData || sensorData.length === 0) return [];

    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = new Date(now - timeRangeMs[selectedTimeRange]);

    // Return ALL data points within the time range
    return sensorData
      .filter(d => new Date(d.timestamp) >= cutoffTime)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [sensorData, selectedTimeRange]);

  const drawEmptyState = useCallback((ctx, width, height) => {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`No ${sensorType} data available`, width / 2, height / 2);
    ctx.font = '12px sans-serif';
    ctx.fillText('for the selected time range', width / 2, height / 2 + 20);
  }, [sensorType]);

  const drawGrid = useCallback((ctx, width, height, padding) => {
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (height - padding.top - padding.bottom) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (width - padding.left - padding.right) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }
  }, []);

  const drawAxes = useCallback((ctx, width, height, padding, minValue, maxValue, minTime, maxTime, unit) => {
    ctx.fillStyle = '#374151';
    ctx.font = '11px sans-serif';

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (maxValue - minValue) * (1 - i / 5);
      const y = padding.top + (height - padding.top - padding.bottom) * (i / 5);
      ctx.fillText(`${formatNumber(value)}${unit}`, padding.left - 5, y + 3);
    }

    // X-axis labels with shorter time format based on selected time range
    const formatTimeForRange = (time) => {
      const date = new Date(time);
      switch (selectedTimeRange) {
        case '1h':
        case '6h':
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        case '24h':
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        case '7d':
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        default:
          return formatTimestamp(date);
      }
    };

    ctx.textAlign = 'center';
    for (let i = 0; i <= 3; i++) {
      const time = new Date(minTime + (maxTime - minTime) * (i / 3));
      const x = padding.left + (width - padding.left - padding.right) * (i / 3);
      ctx.fillText(formatTimeForRange(time), x, height - padding.bottom + 15);
    }
  }, [selectedTimeRange]);

  const drawLine = useCallback((ctx, data, width, height, padding, minValue, valueRange, minTime, timeRange, color) => {
    if (data.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5; // Slightly thinner line for detailed data
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((point.value - minValue) / valueRange) * (height - padding.top - padding.bottom);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, []);

  const drawPoints = useCallback((ctx, data, width, height, padding, minValue, valueRange, minTime, timeRange, color) => {
    // Draw ALL points regardless of density - show original 5-minute intervals
    ctx.fillStyle = color;

    data.forEach((point) => {
      const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((point.value - minValue) / valueRange) * (height - padding.top - padding.bottom);

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI); // Smaller radius for dense data points
      ctx.fill();
    });
  }, []);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = getProcessedData();
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      drawEmptyState(ctx, width, height);
      return;
    }

    // Calculate scales
    const values = data.map(d => d.value);
    const timestamps = data.map(d => new Date(d.timestamp));
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    // Draw grid and axes
    drawGrid(ctx, width, height, padding);
    drawAxes(ctx, width, height, padding, minValue, maxValue, minTime, maxTime, unit);

    // Draw the line and points
    drawLine(ctx, data, width, height, padding, minValue, valueRange, minTime, timeRange, color);
    drawPoints(ctx, data, width, height, padding, minValue, valueRange, minTime, timeRange, color);
  }, [getProcessedData, color, unit, drawEmptyState, drawGrid, drawAxes, drawLine, drawPoints]);

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const data = getProcessedData();
    if (data.length === 0) return;

    // Find closest point
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    const values = data.map(d => d.value);
    const timestamps = data.map(d => new Date(d.timestamp));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    let closestPoint = null;
    let closestDistance = Infinity;

    data.forEach((point) => {
      const x = padding.left + ((new Date(point.timestamp) - minTime) / timeRange) * (rect.width - padding.left - padding.right);
      const y = rect.height - padding.bottom - ((point.value - minValue) / valueRange) * (rect.height - padding.top - padding.bottom);
      
      const distance = Math.sqrt(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2));
      if (distance < closestDistance && distance < 15) {
        closestDistance = distance;
        closestPoint = { ...point, x: mouseX, y: mouseY };
      }
    });

    if (closestPoint) {
      setTooltip({
        x: mouseX,
        y: mouseY,
        type: title,
        value: `${formatNumber(closestPoint.value)} ${unit}`,
        time: formatTimestamp(new Date(closestPoint.timestamp))
      });
    } else {
      setTooltip(null);
    }
  };

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawChart, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">{title}</h3>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 border border-gray-200 rounded cursor-crosshair bg-gray-50"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        
        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white p-2 rounded text-sm pointer-events-none z-10 shadow-lg"
            style={{
              left: Math.min(tooltip.x + 10, 200),
              top: tooltip.y - 10,
              transform: 'translate(0, -100%)'
            }}
          >
            <div className="font-medium">{tooltip.type}</div>
            <div>{tooltip.value}</div>
            <div className="text-gray-300 text-xs">{tooltip.time}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart;