/**
 * Hand-drawn flat scenes for the state components (doc 6). They share one
 * visual language with the 404 page: a soft sparkling ground, the action-primary
 * car, and warm accents. Everything reads from design tokens, so the scenes
 * stay on-theme and RTL-neutral, and the few small motions reuse the global
 * nf* keyframes with motion-reduce switches.
 */

/** The detail-page car, reused so every scene drives the same car. */
function SceneCar({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M60 166 h72 a10 10 0 0 1 10 8 l4 14 h6 a6 6 0 0 1 6 6 v10 a4 4 0 0 1 -4 4 h-8 a14 14 0 0 1 -28 0 h-40 a14 14 0 0 1 -28 0 h-6 a4 4 0 0 1 -4 -4 v-16 a10 10 0 0 1 10 -10 z"
        fill="var(--color-action-primary)"
      />
      <path
        d="M75 166 l6 -18 h34 l10 18 z"
        fill="var(--color-action-primary)"
      />
      <path d="M80 165 l5 -13 h26 l7 13 z" fill="#eaf3ff" />
      <circle cx="60" cy="208" r="10" fill="var(--color-text-primary)" />
      <circle cx="60" cy="208" r="4" fill="#ccc" />
      <circle cx="130" cy="208" r="10" fill="var(--color-text-primary)" />
      <circle cx="130" cy="208" r="4" fill="#ccc" />
    </g>
  );
}

/** Common soft ground under every scene; `dash` adds a center road line. */
function SceneGround({ dash = false }: { dash?: boolean }) {
  return (
    <>
      <path
        d="M0 190 Q 200 150 400 190"
        stroke="var(--color-stroke-heavy)"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />
      {dash && (
        <path
          d="M0 190 Q 200 150 400 190"
          stroke="var(--color-text-on-brand)"
          strokeWidth="3"
          strokeDasharray="14 12"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </>
  );
}

function Spark({ x, y, delay }: { x: number; y: number; delay: string }) {
  return (
    <g
      className={`origin-[${x}px_${y}px] motion-reduce:animate-none animate-[nfFloat_2.2s_ease-in-out_infinite_${delay}]`}
    >
      <line
        x1={x - 7}
        y1={y}
        x2={x + 7}
        y2={y}
        stroke="var(--color-action-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={y - 7}
        x2={x}
        y2={y + 7}
        stroke="var(--color-action-primary)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function Dot({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="3" fill="var(--color-stroke-heavy)" />;
}

/** Route or server failure: the car pulled over with its hood up, a hazard sign up. */
export function ErrorScene() {
  return (
    <svg viewBox="0 0 400 240" className="block h-auto w-full">
      <SceneGround dash />

      {/* Pulled-over car with steam from the open hood */}
      <g>
        <rect
          x="95"
          y="160"
          width="105"
          height="26"
          rx="10"
          fill="var(--color-action-primary)"
        />
        <path
          d="M115 160 l9 -22 h30 l7 22 z"
          fill="var(--color-action-primary)"
        />
        <path d="M127 158 l6 -14 h18 l5 14 z" fill="#eaf3ff" />
        {/* The raised hood */}
        <line
          x1="198"
          y1="160"
          x2="220"
          y2="124"
          stroke="var(--color-brand)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <line
          x1="198"
          y1="160"
          x2="212"
          y2="158"
          stroke="var(--color-brand)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle cx="117" cy="192" r="11" fill="var(--color-text-primary)" />
        <circle cx="117" cy="192" r="4" fill="#ccc" />
        <circle cx="177" cy="192" r="11" fill="var(--color-text-primary)" />
        <circle cx="177" cy="192" r="4" fill="#ccc" />
        {/* Steam puffs */}
        <circle
          cx="222"
          cy="112"
          r="7"
          fill="var(--color-text-option)"
          className="animate-[nfFloat_2.2s_ease-in-out_infinite] motion-reduce:animate-none"
        />
        <circle
          cx="238"
          cy="94"
          r="5"
          fill="var(--color-text-option)"
          className="animate-[nfFloat_2.2s_ease-in-out_infinite_0.3s] motion-reduce:animate-none"
        />
        <circle
          cx="230"
          cy="80"
          r="4"
          fill="var(--color-text-option)"
          className="animate-[nfFloat_2.2s_ease-in-out_infinite_0.6s] motion-reduce:animate-none"
        />
      </g>

      {/* Rounded hazard sign: something needs a look under the hood */}
      <path
        d="M310 120 l36 62 h-72 z"
        fill="var(--color-status-warning)"
        stroke="var(--color-status-warning)"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <rect
        x="306"
        y="146"
        width="8"
        height="18"
        rx="4"
        fill="var(--color-white)"
      />
      <circle cx="310" cy="172" r="4" fill="var(--color-white)" />

      <Spark x={58} y={70} delay="0.2s" />
      <Spark x={350} y={60} delay="0.9s" />
      <Dot cx={392} cy={130} />
      <Dot cx={380} cy={60} />
    </svg>
  );
}

/** Network failure: the road breaks off ahead and the connection is down. */
export function OfflineScene() {
  return (
    <svg viewBox="0 0 400 240" className="block h-auto w-full">
      {/* Two road segments with the break in the middle */}
      <line
        x1="10"
        y1="200"
        x2="150"
        y2="200"
        stroke="var(--color-stroke-heavy)"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="200"
        x2="150"
        y2="200"
        stroke="var(--color-text-on-brand)"
        strokeWidth="3"
        strokeDasharray="14 12"
        strokeLinecap="round"
      />
      <line
        x1="250"
        y1="200"
        x2="390"
        y2="200"
        stroke="var(--color-stroke-heavy)"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="250"
        y1="200"
        x2="390"
        y2="200"
        stroke="var(--color-text-on-brand)"
        strokeWidth="3"
        strokeDasharray="14 12"
        strokeLinecap="round"
      />
      {/* Gap debris */}
      <circle cx="172" cy="196" r="4" fill="var(--color-stroke-heavy)" />
      <circle cx="228" cy="198" r="6" fill="var(--color-stroke-light)" />
      <circle cx="242" cy="188" r="3" fill="var(--color-stroke-heavy)" />

      {/* The car waits on the right segment */}
      <SceneCar transform="translate(240 -2)" />

      {/* The dead connection: a cloud with a slashed signal */}
      <g className="animate-[nfDrift_3.5s_ease-in-out_infinite] motion-reduce:animate-none">
        <path
          d="M200 96 h72 a24 24 0 0 1 0 48 h-72 a24 24 0 0 1 0 -48 z"
          fill="var(--color-stroke-light)"
        />
        <path
          d="M215 112 a26 26 0 0 1 34 0"
          stroke="var(--color-text-subtle)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M222 123 a15 15 0 0 1 20 0"
          stroke="var(--color-text-subtle)"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="232" cy="130" r="4" fill="var(--color-text-subtle)" />
        <line
          x1="206"
          y1="102"
          x2="266"
          y2="140"
          stroke="var(--color-status-error)"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>

      <Spark x={70} y={92} delay="0.4s" />
      <Dot cx={124} cy={56} />
      <Dot cx={356} cy={62} />
    </svg>
  );
}

/** Session expired: what the visitor wants sits behind a padlock. */
export function UnauthorizedScene() {
  return (
    <svg viewBox="0 0 400 240" className="block h-auto w-full">
      <SceneGround dash />
      <SceneCar transform="translate(-10 -12)" />

      {/* The locked gate */}
      <g className="animate-[nfDrift_3.5s_ease-in-out_infinite] motion-reduce:animate-none">
        <path
          d="M205 132 v-22 a24 24 0 0 1 48 0 v22"
          stroke="var(--color-action-primary)"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
        <rect
          x="180"
          y="130"
          width="98"
          height="72"
          rx="14"
          fill="var(--color-brand)"
        />
        <circle cx="229" cy="160" r="8" fill="var(--color-text-on-brand)" />
        <rect
          x="225"
          y="164"
          width="8"
          height="16"
          rx="4"
          fill="var(--color-text-on-brand)"
        />
      </g>

      <Spark x={90} y={70} delay="0.6s" />
      <Spark x={330} y={82} delay="1.2s" />
      <Dot cx={210} cy={52} />
      <Dot cx={386} cy={130} />
    </svg>
  );
}

/** A specific resource (car, city, booking) is gone: a search over the map. */
export function ResourceScene() {
  return (
    <svg viewBox="0 0 400 240" className="block h-auto w-full">
      <SceneGround />

      {/* The map with the route taken and the pins */}
      <g className="animate-[nfDrift_3.5s_ease-in-out_infinite] motion-reduce:animate-none">
        <path
          d="M96 120 l52 -22 52 22 52 -22 52 22 v76 l-52 22 -52 -22 -52 22 -52 -22 z"
          fill="var(--color-surface-card-primary)"
          stroke="var(--color-stroke-light)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M112 150 q 44 -18 70 8 t 74 4"
          stroke="var(--color-text-option)"
          strokeWidth="5"
          strokeDasharray="10 10"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="146" cy="130" r="10" fill="var(--color-action-primary)" />
        <path d="M139 136 l7 14 7 -14 z" fill="var(--color-action-primary)" />
        <circle cx="146" cy="130" r="4" fill="var(--color-white)" />
        <circle cx="242" cy="118" r="10" fill="var(--color-action-primary)" />
        <path d="M235 124 l7 14 7 -14 z" fill="var(--color-action-primary)" />
        <circle cx="242" cy="118" r="4" fill="var(--color-white)" />
      </g>

      {/* The search that finds nothing */}
      <circle
        cx="300"
        cy="158"
        r="30"
        fill="var(--color-surface-on-background)"
        stroke="var(--color-text-subtle)"
        strokeWidth="6"
      />
      <line
        x1="322"
        y1="180"
        x2="344"
        y2="202"
        stroke="var(--color-text-subtle)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <text
        x="300"
        y="168"
        textAnchor="middle"
        fontSize="26"
        fontWeight="800"
        fill="var(--color-text-subtle)"
        className="animate-[nfFloat_2.2s_ease-in-out_infinite_0.3s] motion-reduce:animate-none"
      >
        ?
      </text>

      <Spark x={70} y={78} delay="0.5s" />
      <Dot cx={360} cy={70} />
      <Dot cx={388} cy={132} />
    </svg>
  );
}
