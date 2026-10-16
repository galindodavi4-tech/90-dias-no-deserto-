"use client";

import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type ComponentRef } from "react";
import type { Group, MeshStandardMaterial } from "three";
import { partIds } from "@/lib/parts";
import type { Part, RocketModel } from "@/lib/schemas";

const COLORS = {
  hull: "#d9efec",
  engine: "#58787c",
  nose: "#2ee6d6",
  fin: "#14b8a6",
  fail: "#ff3b4d",
  hover: "#6eeadf",
};

/** Dimensões de cada estágio, do 1º (base) ao 4º. */
const TANK_HEIGHT = [2.4, 1.6, 1.15, 0.9];
const TANK_RADIUS = [0.6, 0.55, 0.5, 0.45];
const ENGINE_HEIGHT = 0.5;
const NOSE_HEIGHT = 1.1;

type Hover = { part: Part; point: [number, number, number] } | null;

export type RocketViewerHandle = { resetCamera: () => void };

type MeshProps = {
  part: Part | undefined;
  hovered: boolean;
  onHover: (h: Hover) => void;
  baseColor: string;
  ghost?: boolean;
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

/** Uma malha do foguete. Peça reprovada fica vermelha e pulsa (emissivo). */
function PartMesh({ part, hovered, onHover, baseColor, ghost, children, position, rotation }: MeshProps) {
  const mat = useRef<MeshStandardMaterial>(null);
  const failed = part?.status === "fail";

  useFrame(({ clock }) => {
    if (mat.current && failed) mat.current.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 3) * 0.35;
  });

  const handlers = part
    ? {
        onPointerMove: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover({ part, point: [e.point.x, e.point.y, e.point.z] });
        },
        onPointerOut: () => onHover(null),
      }
    : {};

  return (
    <mesh position={position} rotation={rotation} castShadow {...handlers}>
      {children}
      <meshStandardMaterial
        ref={mat}
        color={failed ? COLORS.fail : hovered ? COLORS.hover : baseColor}
        emissive={failed ? "#ff2236" : hovered ? "#0f8f86" : "#000000"}
        emissiveIntensity={failed ? 0.6 : 0.35}
        metalness={0.55}
        roughness={0.35}
        transparent={ghost}
        opacity={ghost ? 0.35 : 1}
        wireframe={ghost}
      />
    </mesh>
  );
}

function Rocket({ model, spread, hover, onHover }: { model: RocketModel; spread: number; hover: Hover; onHover: (h: Hover) => void }) {
  const byId = useMemo(() => new Map(model.parts.map((p) => [p.id, p])), [model.parts]);
  const isHovered = (id: string) => hover?.part.id === id;
  const finsPart = byId.get(partIds.fins);
  const showFins = model.hasFins || finsPart?.status === "fail";

  // Empilha de baixo para cima; `spread` afasta as peças (vista explodida).
  const pieces: React.ReactNode[] = [];
  let y = 0;
  for (let s = 1; s <= model.stageCount; s++) {
    const r = TANK_RADIUS[s - 1];
    const h = TANK_HEIGHT[s - 1];
    const enginesId = partIds.engines(s);
    const tankId = partIds.tank(s);
    const bells = s === 1 ? Math.min(5, Math.max(1, Math.round(r * 6))) : 1;

    for (let b = 0; b < bells; b++) {
      const angle = (b / bells) * Math.PI * 2;
      const off = bells === 1 ? 0 : r * 0.55;
      pieces.push(
        <PartMesh key={`${enginesId}-${b}`} part={byId.get(enginesId)} hovered={isHovered(enginesId)} onHover={onHover} baseColor={COLORS.engine}
          position={[Math.cos(angle) * off, y + ENGINE_HEIGHT / 2, Math.sin(angle) * off]}>
          <cylinderGeometry args={[r * (bells === 1 ? 0.35 : 0.16), r * (bells === 1 ? 0.6 : 0.3), ENGINE_HEIGHT, 24, 1, true]} />
        </PartMesh>,
      );
    }
    y += ENGINE_HEIGHT + spread;

    pieces.push(
      <PartMesh key={tankId} part={byId.get(tankId)} hovered={isHovered(tankId)} onHover={onHover} baseColor={COLORS.hull} position={[0, y + h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 48]} />
      </PartMesh>,
    );

    if (s === 1 && showFins) {
      for (let f = 0; f < 4; f++) {
        const angle = (f / 4) * Math.PI * 2 + Math.PI / 4;
        const dist = r + 0.3 + spread * 0.6;
        pieces.push(
          <PartMesh key={`fin-${f}`} part={finsPart} hovered={isHovered(partIds.fins)} onHover={onHover} baseColor={COLORS.fin}
            ghost={!model.hasFins} position={[Math.cos(angle) * dist, y + 0.45, Math.sin(angle) * dist]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.62, 0.9, 0.05]} />
          </PartMesh>,
        );
      }
    }
    y += h + spread;
  }

  const topR = TANK_RADIUS[model.stageCount - 1];
  pieces.push(
    <PartMesh key="nose" part={byId.get(partIds.nose)} hovered={isHovered(partIds.nose)} onHover={onHover} baseColor={COLORS.nose} position={[0, y + NOSE_HEIGHT / 2, 0]}>
      <coneGeometry args={[topR, NOSE_HEIGHT, 48]} />
    </PartMesh>,
  );
  const height = y + NOSE_HEIGHT;

  return (
    <group position={[0, -height / 2, 0]}>
      {pieces}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[2.2, 64]} />
        <meshStandardMaterial color="#0e3038" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Cartão flutuante com o nome da peça e o motivo da falha, no ponto do cursor. */
function Tooltip({ hover }: { hover: Hover }) {
  if (!hover) return null;
  const { part, point } = hover;
  return (
    <Html position={point} style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
      <div className="ds-card w-56 -translate-x-1/2 -translate-y-[calc(100%+14px)] !rounded-2xl px-3.5 py-2.5 text-xs">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <span className={`size-2 rounded-full ${part.status === "fail" ? "bg-danger" : "bg-success"}`} />
          {part.label}
        </p>
        <p className="mt-1 text-ink-muted">{part.reason ?? (part.status === "fail" ? "Reprovada" : "Sem problemas")}</p>
      </div>
    </Html>
  );
}

function Spin({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current && enabled) ref.current.rotation.y += dt * 0.25;
  });
  return <group ref={ref}>{children}</group>;
}

type Props = { model: RocketModel; spread: number };

/** Visualizador 3D: girar e dar zoom com o mouse/toque, passar por cima mostra a peça. */
export const RocketViewer = forwardRef<RocketViewerHandle, Props>(function RocketViewer({ model, spread }, ref) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [hover, setHover] = useState<Hover>(null);
  useImperativeHandle(ref, () => ({ resetCamera: () => controls.current?.reset() }), []);

  return (
    <Canvas shadows camera={{ position: [5.5, 2.5, 6.5], fov: 42 }} dpr={[1, 2]} className="!touch-none">
      <color attach="background" args={["#04121a"]} />
      <fog attach="fog" args={["#04121a", 14, 30]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.6} castShadow />
      <pointLight position={[-4, 2, -3]} intensity={30} color="#2ee6d6" />
      <pointLight position={[3, -3, 4]} intensity={18} color="#ffc29a" />
      <Stars radius={40} depth={30} count={1800} factor={3} fade speed={0.6} />
      <Spin enabled={!hover}>
        <Rocket model={model} spread={spread} hover={hover} onHover={setHover} />
      </Spin>
      <Tooltip hover={hover} />
      <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={4} maxDistance={16} />
    </Canvas>
  );
});
