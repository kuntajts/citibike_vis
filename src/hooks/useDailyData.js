import { useState, useEffect } from 'react';

const useDailyData = () => {
  const [dailyData, setDailyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${mm}-${dd}`;

        const response = await fetch(`/data/${dateStr}.json`);
        if (!response.ok) {
          console.error('No data found for today');
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        setDailyData(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load daily data', err);
        setIsLoading(false);
      }
    };
    fetchDailyData();
  }, []);

  return { dailyData, isLoading };
};

export default useDailyData;
