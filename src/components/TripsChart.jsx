import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const TripsChart = ({ trips, currentTime }) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  const timeRef = useRef(currentTime);

  const dateStr = new Date(currentTime).toDateString();

  useEffect(() => {
    if (!canvasRef.current || !trips.length) return;

    const outgoingHours = new Array(24).fill(0);
    const incomingHours = new Array(24).fill(0);

    trips.forEach((t) => {
      const h = new Date(t.startTimeTs).getHours();
      if (t.type === 'incoming') {
        incomingHours[h]++;
      } else {
        outgoingHours[h]++;
      }
    });

    const ctx = canvasRef.current.getContext('2d');
    const chartTitle = `Trips on ${new Date(dateStr).toLocaleDateString()}`;

    if (chartInstance.current) {
      // Update existing chart
      chartInstance.current.data.datasets[0].data = outgoingHours;
      chartInstance.current.data.datasets[1].data = incomingHours;
      chartInstance.current.options.scales.y.title.text = chartTitle;
      chartInstance.current.update();
    } else {
      // Create new chart
      const outGradient = ctx.createLinearGradient(0, 0, 0, 200);
      outGradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      outGradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');

      const inGradient = ctx.createLinearGradient(0, 0, 0, 200);
      inGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
      inGradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');

      const labels = Array.from({ length: 24 }, (_, i) => {
        const d = new Date();
        d.setHours(i);
        return d.toLocaleTimeString('en-US', { hour: 'numeric' });
      });

      // Vertical Line Plugin
      const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
          const now = timeRef.current;
          if (!now) return;

          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;

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
              label: 'Outgoing',
              data: outgoingHours,
              backgroundColor: outGradient,
              borderRadius: 4,
              barPercentage: 0.8,
            },
            {
              label: 'Incoming',
              data: incomingHours,
              backgroundColor: inGradient,
              borderRadius: 4,
              barPercentage: 0.8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'rgba(255,255,255,0.7)',
                boxWidth: 12,
                font: { size: 10 },
              },
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: ${context.raw} trips`,
              },
            },
          },
          scales: {
            y: {
              stacked: true,
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
              stacked: true,
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
