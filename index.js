const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

const changeButton = document.querySelector("button.change-mode")
const audioButton = document.querySelector("button.connect-audio")
const mouseButton = document.querySelector("button.toggle-mouse-interact")
const modeView = document.querySelector(".mode")
const container = document.querySelector(".container")

class Particle {
  constructor(x, y, i) {
    this.x = x
    this.y = y
    this.i = i
    this.nextX = x
    this.waveX = x
    this.nextY = canvas.height / 2 + Math.cos(delta + i / 10) * 40
    this.bigCircle = false
  }

  draw() {
    ctx.fillStyle = audioConnected ? `hsl(${55 + volume}, 100%, 50%)` : "white"

    ctx.beginPath()
    ctx.arc(this.x, this.y, PARTICLE_RADIUS, 0, 2 * Math.PI)
    ctx.fill()
  }

  update() {
    switch (mode) {
      case "wave":
        this.wave()
        this.nextX = this.waveX
        break
      case "circle":
        this.circle()
    }

    const div = 5
    this.x += (this.nextX - this.x) / div
    this.y += (this.nextY - this.y) / div
  }

  wave() {
    let offset = 0

    if (
      mouseInteract &&
      mouseX >= this.x - (canvas.width / NUMBER_OF_PARTICLES) * 2 &&
      mouseX <= this.x + (canvas.width / NUMBER_OF_PARTICLES) * 2
    ) {
      offset = 60
    }

    this.nextY = canvas.height / 2 + Math.cos(delta + this.i / 10) * (60 + volume + offset)
  }

  circle() {
    if (mouseInteract) {
      const dx = mouseX - canvas.width / 2
      const dy = mouseY - canvas.height / 2
      const distance = Math.sqrt(Math.abs(dx * dx) + Math.abs(dy * dy))

      if (!this.bigCircle && distance <= CIRCLE_RADIUS) {
        this.bigCircle = true
      } else if (this.bigCircle && distance >= CIRCLE_RADIUS * 2) {
        this.bigCircle = false
      }
    }

    const rad = CIRCLE_RADIUS + (this.bigCircle && CIRCLE_RADIUS)
    const mult = rad + volume + rad / 3
    const d = delta + (this.i * Math.PI) / (NUMBER_OF_PARTICLES / 2)

    this.nextX = canvas.width / 2 + Math.sin(d) * mult
    this.nextY = canvas.height / 2 + Math.cos(d) * mult
  }
}

const MODES = ["wave", "circle"]
let mode = MODES[0]

let audioConnected = false
let analyzerNode,
  sourceNode,
  pcmData,
  volume = 0

const NUMBER_OF_PARTICLES = 70
const PARTICLE_RADIUS = 3
const CIRCLE_RADIUS = 100
const particles = []
let mouseX = 0,
  mouseY = 0,
  mouseInteract = false

let delta = 0

function generateParticles() {
  for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
    particles.push(
      new Particle(
        (canvas.width / NUMBER_OF_PARTICLES) * i + canvas.width / NUMBER_OF_PARTICLES / 2,
        canvas.height / 2,
        i
      )
    )
  }
}

function update() {
  for (let particle of particles) {
    particle.update()
    particle.draw()
  }
}

function measureVolume() {
  analyzerNode.getFloatTimeDomainData(pcmData)

  volume = 0
  for (let amplitude of pcmData) {
    volume += Math.abs(amplitude)
  }

  volume = Math.round(volume)
}

function connectedMessage() {
  audioButton.innerText = "Audio connected"

  const messageElement = document.createElement("p")
  messageElement.innerText = "Audio connected"

  container.appendChild(messageElement)
  setTimeout(() => messageElement.remove(), 1500)
}

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  update()

  if (audioConnected) measureVolume()

  delta += mode === "wave" ? 0.1 : 0.2

  if (delta >= 2 * Math.PI) {
    delta = 0
  }

  requestAnimationFrame(animate)
}

window.addEventListener("resize", () => {
  resizeCanvas()

  particles.splice(0, NUMBER_OF_PARTICLES)
  generateParticles()
})

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
})

changeButton.addEventListener("click", () => {
  if (mode === "wave") {
    modeView.innerText = mode = "circle"
  } else {
    modeView.innerText = mode = "wave"
  }
})

audioButton.addEventListener("click", () => {
  audioButton.disabled = true

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((mediaStream) => {
      const audioContext = new AudioContext()
      sourceNode = audioContext.createMediaStreamSource(mediaStream)

      analyzerNode = audioContext.createAnalyser()
      pcmData = new Float32Array(analyzerNode.fftSize)

      sourceNode.connect(analyzerNode)

      audioConnected = true

      connectedMessage()
    })
    .catch(() => (audioButton.disabled = false))
})

mouseButton.addEventListener("click", () => {
  mouseInteract = !mouseInteract

  if (mouseInteract) {
    mouseButton.innerText = "Mouse interact: on"
  } else {
    mouseButton.innerText = "Mouse interact: off"
  }
})

resizeCanvas()
generateParticles()
animate()
