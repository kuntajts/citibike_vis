import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const TripsChart = ({ trips, currentTime }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  const timeRef = useRef(currentTime);

  const dateStr = new Date(currentTime).toDateString();

  useEffect(() => {
    if (!canvasRef.current || !trips.length) return;

    const hours = new Array(24).fill(0);
    trips.forEach((t) => {
      const h = new Date(t.startTimeTs).getHours();
      hours[h]++;
    });

    const ctx = canvasRef.current.getContext('2d');
    const chartTitle = `Trips on ${new Date(dateStr).toLocaleDateString()}`;

    if (chartInstance.current) {
      // Update existing chart
      chartInstance.current.data.datasets[0].data = hours;
      chartInstance.current.options.scales.y.title.text = chartTitle;
      chartInstance.current.update();
    } else {
      // Create new chart
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

      const labels = Array.from({ length: 24 }, (_, i) => {
        const d = new Date();
        d.setHours(i);
        return d.toLocaleTimeString('en-US', { hour: 'numeric' });
      });

      // Vertical Line Plugin (defined in previous scope, passed here or redefined)
      // Ideally we keep the plugin definition consistent.

      // Re-defining plugin here to capture scope if needed, but it uses timeRef.
      const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
          const now = timeRef.current;
          if (!now) return;

          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;

          // Calculate position
          const date = new Date(now);
          const currentHour = date.getHours() + date.getMinutes() / 60;

          const xStart = xAxis.left;
          const xEnd = xAxis.right;
          const width = xEnd - xStart;

          const xPos = xStart + (currentHour / 24) * width;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xPos, yAxis.top);
          ctx.lineTo(xPos, yAxis.bottom);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ef4444';
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
        },
      };

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Trips Started',
              data: hours,
              backgroundColor: gradient,
              borderRadius: 4,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.raw} trips`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1 },
              title: {
                display: true,
                text: chartTitle,
                color: 'rgba(255,255,255,0.5)',
                font: { size: 10 },
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                color: 'rgba(255,255,255,0.5)',
                font: { size: 10 },
                maxTicksLimit: 8,
              },
              title: {
                display: true,
                text: 'Time of Day',
                color: 'rgba(255,255,255,0.5)',
                font: { size: 10 },
              },
            },
          },
        },
        plugins: [verticalLinePlugin],
      });
    }

    return () => {};
  }, [trips, dateStr]);

  // Force redraw for time updates
  useEffect(() => {
    timeRef.current = currentTime;
    if (chartInstance.current) {
      chartInstance.current.update('none');
    }
  }, [currentTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="chart-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default TripsChart;
