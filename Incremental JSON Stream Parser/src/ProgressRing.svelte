<script>
  export let progress = 0
  export let isParsing = false

  const size = 100
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
</script>

<div class="progress-ring" class:parsing={isParsing}>
  <svg {size} viewBox={`0 0 ${size} ${size}`}>
    <circle
      class="ring-bg"
      stroke-width={strokeWidth}
      {radius}
      cx={size / 2}
      cy={size / 2}
      fill="transparent"
    />
    <circle
      class="ring-progress"
      stroke-width={strokeWidth}
      {radius}
      cx={size / 2}
      cy={size / 2}
      fill="transparent"
      stroke-dasharray={circumference}
      stroke-dashoffset={circumference - (progress / 100) * circumference}
      style="transform: rotate(-90deg); transform-origin: 50% 50%;"
    />
  </svg>
  <span class="progress-text">{Math.round(progress)}%</span>
</div>

<style>
  .progress-ring {
    position: relative;
    width: 100px;
    height: 100px;
  }

  .ring-bg {
    stroke: rgba(255, 255, 255, 0.1);
  }

  .ring-progress {
    stroke: url(#gradient);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
  }

  .progress-ring.parsing .ring-progress {
    animation: glow 1.5s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% {
      filter: drop-shadow(0 0 5px #00d4ff);
    }
    50% {
      filter: drop-shadow(0 0 20px #00d4ff);
    }
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: bold;
    color: #00d4ff;
  }

  svg {
    filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.3));
  }

  :global(svg defs) {
    display: block;
  }
</style>

<svg style="position: absolute; width: 0; height: 0;">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d4ff" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
  </defs>
</svg>