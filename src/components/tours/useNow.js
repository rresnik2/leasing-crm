import { useEffect, useState } from 'react';

// The current time, refreshed at the top of every minute.
export default function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const schedule = () => {
      const current = new Date();
      const untilNextMinute = 60000 - (current.getSeconds() * 1000 + current.getMilliseconds());
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, untilNextMinute + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return now;
}
