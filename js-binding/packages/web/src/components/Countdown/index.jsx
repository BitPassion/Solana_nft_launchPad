import React from "react";
//import styles from "./Countdown.module.css";
import { useEffect, useState } from "react";
import moment from "moment";

const Countdown = ({timestamp}) => {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);
  const [timerId, setTimerId] = useState(null);

  const clearTimer = () => {
    if (timerId)
     clearInterval(timerId);
    const id = setInterval(() => {
        startTimer();
    }, 1000)
    setTimerId(id);
  }

  useEffect(async () => {
    clearTimer();
  }, []);

  const startTimer = () => {
    getTimeRemaining();
    
  }

  const getTimeRemaining = () => {
    const total = timestamp - moment().unix();
    if (total > 0) {
      const seconds = Math.floor((total) % 60);
      const minutes = Math.floor((total / 60) % 60);
      const hours = Math.floor((total / 60 / 60) % 24);

      setSecond(seconds);
      setMinute(minutes);
      setHour(hours);
    }
  }

  return (
    <div>
      {hour >= 10 ? hour : '0' + hour}:{minute >= 10 ? minute : '0' + minute}:{second >= 10 ? second : '0' + second}
    </div>
  );
};

export default Countdown;
