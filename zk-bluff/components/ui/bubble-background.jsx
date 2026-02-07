"use client";;
// This is from a website that does UI components
import React, { useEffect, useRef } from "react";

const defaultBubbleColors = {
  colorA: "21, 32, 58",
  colorB: "150, 30, 45",
  colorC: "36, 47, 77",
  colorD: "186, 34, 55",
  colorE: "10, 23, 42",
  interactive: "255, 69, 58",
};

const BubbleBackground = ({
  bgColorA = "rgb(12 22 45)",
  bgColorB = "rgb(92 18 28)",
  bubbleColors = defaultBubbleColors,
  blendMode = "hard-light",
  bubbleSize = "50%",
}) => {
  const interactiveRef = useRef(null);

  useEffect(() => {
    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;
    const easeFactor = 10;
    let animationFrameId;

    function move() {
      if (!interactiveRef.current) return;

      curX += (tgX - curX) / easeFactor;
      curY += (tgY - curY) / easeFactor;

      interactiveRef.current.style.transform = `translate(${curX}px, ${curY}px)`;
      animationFrameId = requestAnimationFrame(move);
    }

    const handlePointerMove = (e) => {
      tgX = e.clientX;
      tgY = e.clientY;
    };

    window.addEventListener("pointermove", handlePointerMove);
    animationFrameId = requestAnimationFrame(move);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Calculate common positions
  const centerTop = `calc(50% - ${bubbleSize} / 2)`;
  const centerLeft = `calc(50% - ${bubbleSize} / 2)`;

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(40deg, ${bgColorA}, ${bgColorB})`,
      }}>
      <svg className="absolute w-0 h-0">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
            result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div
        className="w-full h-full"
        style={{
          filter: "url(#goo) blur(40px)",
        }}>
        <div
          className="absolute"
          style={{
            width: bubbleSize,
            height: bubbleSize,
            top: centerTop,
            left: centerLeft,
            background: `radial-gradient(circle at center, rgba(${bubbleColors.colorA}, 0.8) 0, rgba(${bubbleColors.colorA}, 0) 50%)`,
            mixBlendMode: blendMode,
            transformOrigin: "center center",
            animation: "bounceV 30s ease infinite",
          }} />

        <div
          className="absolute"
          style={{
            width: bubbleSize,
            height: bubbleSize,
            top: centerTop,
            left: centerLeft,
            background: `radial-gradient(circle at center, rgba(${bubbleColors.colorB}, 0.8) 0, rgba(${bubbleColors.colorB}, 0) 50%)`,
            mixBlendMode: blendMode,
            transformOrigin: "calc(50% - 400px)",
            animation: "moveInCircle 20s reverse infinite",
          }} />

        <div
          className="absolute"
          style={{
            width: bubbleSize,
            height: bubbleSize,
            top: `calc(50% - ${bubbleSize} / 2 + 200px)`,
            left: `calc(50% - ${bubbleSize} / 2 - 500px)`,
            background: `radial-gradient(circle at center, rgba(${bubbleColors.colorC}, 0.8) 0, rgba(${bubbleColors.colorC}, 0) 50%)`,
            mixBlendMode: blendMode,
            transformOrigin: "calc(50% + 400px)",
            animation: "moveInCircle 40s linear infinite",
          }} />

        <div
          className="absolute"
          style={{
            width: bubbleSize,
            height: bubbleSize,
            top: centerTop,
            left: centerLeft,
            background: `radial-gradient(circle at center, rgba(${bubbleColors.colorD}, 0.7) 0, rgba(${bubbleColors.colorD}, 0) 50%)`,
            mixBlendMode: blendMode,
            transformOrigin: "calc(50% - 200px)",
            animation: "bounceH 40s ease infinite",
          }} />

        <div
          className="absolute"
          style={{
            width: `calc(${bubbleSize} * 2)`,
            height: `calc(${bubbleSize} * 2)`,
            top: `calc(50% - ${bubbleSize})`,
            left: `calc(50% - ${bubbleSize})`,
            background: `radial-gradient(circle at center, rgba(${bubbleColors.colorE}, 0.8) 0, rgba(${bubbleColors.colorE}, 0) 50%)`,
            mixBlendMode: blendMode,
            transformOrigin: "calc(50% - 800px) calc(50% + 200px)",
            animation: "moveInCircle 20s ease infinite",
          }} />

        <div
          ref={interactiveRef}
          className="absolute w-full h-full"
          style={{
            top: "-50%",
            left: "-50%",
            background: `radial-gradient(circle at center, rgba(${bubbleColors.interactive}, 0.7) 0, rgba(${bubbleColors.interactive}, 0) 50%)`,
            mixBlendMode: blendMode,
          }} />
      </div>
    </div>
  );
};

export default BubbleBackground;