import React from "react";
import styles from "./Timer.module.css";
import { useEffect, useRef, useState } from "react";

const Timer = () => {
  const [hour, setHour] = useState(23);
  const [minute, setMinute] = useState(5);
  const [second, setSecond] = useState(10);
  const Ref = useRef(null);

  const clearTimer = (e) => {
    if (Ref.current)
     clearInterval(Ref.current);
    const id = setInterval(() => {
        startTimer(e);
    }, 1000)
    Ref.current = id;
  }

const getDeadTime = () => {
  var deadline = new Date();
  var startDate = new Date();
  var endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 10);
  deadline.setSeconds((endDate.getTime() - startDate.getTime()) / 1000);
  return deadline;
}

  useEffect(async () => {
    clearTimer(getDeadTime());
  }, []);

  const startTimer = (e) => {
    getTimeRemaining(e);
    
  }

  const getTimeRemaining = (e) => {
    const total = Date.parse(e) - Date.parse(new Date());
    if (total > 0) {
      const seconds = Math.floor((total / 1000) % 60);
      const minutes = Math.floor((total / 1000 / 60) % 60);
      const hours = Math.floor((total / 1000 / 60 / 60) % 24);

      setSecond(seconds);
      setMinute(minutes);
      setHour(hours);
    }
  }

  return (
    <div className={styles.timer}>
      <div className={styles.timerBoxContainer}>
        <p className={styles.timerBox}>{hour >= 10 ? hour : '0' + hour}</p>
        <span className={styles.text}>hours</span>
      </div>
      <div className={styles.timerColon}>
        <p>:</p>
      </div>
      <div className={styles.timerBoxContainer}>
        <p className={styles.timerBox}>{minute >= 10 ? minute : '0' + minute}</p>
        <span className={styles.text}>mins</span>
      </div>
      <div className={styles.timerColon}>
        <p>:</p>
      </div>
      <div className={styles.timerBoxContainer}>
        <p className={styles.timerBox}>{second >= 10 ? second : '0' + second}</p>
        <span className={styles.text}>sec</span>
      </div>
    </div>
  );
};

export default Timer;
