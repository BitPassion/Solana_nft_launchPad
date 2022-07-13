import React, { Component } from "react";
import Carousel from "react-spring-3d-carousel";
import { GrNext, GrPrevious } from "react-icons/gr";
import { v4 as uuidv4 } from "uuid";
import { config } from "react-spring";
import ArtCard from "../ArtCard-Atlas";
import img1 from "../../../../../assets/face.png";
import img2 from "../../../../../assets/horror.png";
import img3 from "../../../../../assets/fire.png";
import styles from "./Slider.module.css";

export default class Slider extends Component {
  state = {
    goToSlide: 0,
    offsetRadius: 1,
    showNavigation: true,
    config: config.gentle,
  };

  slides = [
    {
      key: uuidv4(),
      content: <ArtCard img={img1} />,
    },
    {
      key: uuidv4(),
      content: <ArtCard img={img2} />,
    },
    {
      key: uuidv4(),
      content: <ArtCard img={img3} />,
    },
    {
      key: uuidv4(),
      content: <ArtCard img={img1} />,
    },
    {
      key: uuidv4(),
      content: <ArtCard img={img3} />,
    },
    {
      key: uuidv4(),
      content: <ArtCard img={img2} />,
    },
  ].map((slide, index) => {
    return { ...slide, onClick: () => this.setState({ goToSlide: index }) };
  });

  onChangeInput = (e) => {
    this.setState({
      [e.target.name]: parseInt(e.target.value, 10) || 0,
    });
  };

  render() {
    return (
      <div
        className={styles.sliderContainer}
        style={{
          width: "60%",
          height: "500px",
          margin: "40px auto",
        }}
      >
        <Carousel
          slides={this.slides}
          goToSlide={this.state.goToSlide}
          offsetRadius={this.state.offsetRadius}
          showNavigation={this.state.showNavigation}
          animationConfig={this.state.config}
        />

        <div>
          <div>
            <button
              className={styles.btnPrev}
              onClick={() => {
                this.setState({ goToSlide: this.state.goToSlide - 1 });
              }}
            >
              <GrPrevious />
            </button>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <button
              className={styles.btnNext}
              onClick={() => {
                this.setState({ goToSlide: this.state.goToSlide + 1 });
              }}
            >
              <GrNext />
            </button>
          </div>
        </div>
      </div>
    );
  }
}
