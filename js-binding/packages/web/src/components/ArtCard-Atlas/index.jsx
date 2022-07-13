import React from "react";
import styles from "./ArtCard.module.css";

const ArtCard = ({ img }) => {
  return (
    <>
      <div className={styles.card}>
        <div
          className={styles.cardImageContainer}
          // style={{ backgroundImage: `url(${img})` }}
        >
          <img src={img.src} style={{width: '100' + '%', objectFit: 'contain'}} />
          </div>
        <div className={styles.contentContaier}>
          <h3>Lorem ipsum dolor</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            tincidunt commodo est non mattis.
          </p>
          <button>Preview</button>
        </div>
      </div>
    </>
  );
};

export default ArtCard;
