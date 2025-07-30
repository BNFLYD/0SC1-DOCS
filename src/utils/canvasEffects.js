export const drawStaticEffect = (ctx, width, height, options = {}) => {
  const {
    theme = "dark",
    intensity = 100,
    flashProbability = 0.1,
    lineWidth = { min: 5, max: 25 }
  } = options

  // Color de la estática basado en el tema
  ctx.fillStyle = theme === "dark" ? "#ffffff" : "#000000"

  // Dibujar líneas aleatorias
  for (let i = 0; i < intensity; i++) {
    ctx.fillRect(
      Math.random() * width,
      Math.random() * height,
      Math.random() * (lineWidth.max - lineWidth.min) + lineWidth.min,
      1
    )
  }

  // Efecto de flash
  if (Math.random() < flashProbability) {
    ctx.fillStyle = `rgba(${
      theme === "dark" ? "255, 255, 255" : "0, 0, 0"
    }, ${Math.random() * 0.3 + 0.1})`
    ctx.fillRect(0, 0, width, height)
  }
}
