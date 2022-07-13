import React from "react";
import styles from "./project-details.module.css";
// const {userAccounts, accountByMint} = useUserAccounts();

const ProjectDetails = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Project Details</h2>
        <h2 className={styles.title}>Join Raffle</h2>
      </div>

      <div className={styles.detailsContainer}>
        <div className={styles.detailsBox}>
          <table>
            <tr>
              <td>Total NFTs:</td>
              <td>1000</td>
            </tr>

            <tr>
              <td>Price:</td>
              <td>1000 USD</td>
            </tr>

            <tr>
              <td>TWebsite:</td>
              <td>www.loremipsum.com</td>
            </tr>

            <tr>
              <td>Description:</td>
              <td>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
                a massa ac sem ornare cursus ac ac risus. Aenean varius aliquam
                est vestibulum placerat. Phasellus at ante convallis, ultrices
                risus id, sodales felis. Morbi imperdiet ut urna id varius.
                Nullam sit amet urna urna. Morbi sed egestas metus, ultrices
                tincidunt elit. Maecenas nunc nibh, ornare vel sapien quis,
                lobortis scelerisque magna. Ut ac viverra eros. Morbi vulputate
                eros ac
              </td>
            </tr>
          </table>
        </div>

        <div className={styles.detailsBox}>
          <table>
            <tr>
              <td width="160px">Your Stakes ATLAS:</td>
              <td>1000</td>
            </tr>

            <tr>
              <td>Your eligible Tickets:</td>
              <td>1000 USD</td>
            </tr>

            <tr>
              <td>Your eligible Tickets:</td>
              <td>www.loremipsum.com</td>
            </tr>

            <tr>
              <td>Description:</td>
              <td>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
                a massa ac sem ornare cursus ac ac risus. Aenean varius aliquam
                est vestibulum placerat. Phasellus at ante convallis, ultrices
                risus id, sodales felis. Morbi imperdiet ut urna id varius.
                Nullam sit amet urna urna. Morbi sed egestas metus, ultrices
                tincidunt elit. eros ac
              </td>
            </tr>
            <tr>
              <td colSpan="2" style={{ display: "table-cell" }}>
                <button className={styles.button}>Join Raffle</button>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
