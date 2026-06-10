"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeDVirtualMuseum({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0705, 0.02);
    scene.background = new THREE.Color(0x150f0c);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1.7, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xfff4df, 0x24140f, 1.2);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff4d9, 1.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);
    const fill = new THREE.PointLight(0xc59f59, 2.2, 25, 2);
    fill.position.set(0, 2.5, 2.5);
    scene.add(fill);

    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x17100d,
      roughness: 0.95,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const grid = new THREE.GridHelper(40, 24, 0xc59f59, 0x3a2a1f);
    grid.position.y = 0.01;
    scene.add(grid);

    const artifacts: THREE.Mesh[] = [];
    const artifactData = [
      {
        title: "Meera & Ramesh",
        subtitle: "Wedding Day, 1984",
        note: "A beautiful beginning...",
        position: new THREE.Vector3(-3.2, 0.9, -2.2),
        rotationY: 0.08,
      },
      {
        title: "Aarav's First Steps",
        subtitle: "Spring, 1992",
        note: "First steps in the garden.",
        position: new THREE.Vector3(-1.4, 0.9, -2.4),
        rotationY: -0.04,
      },
      {
        title: "Family Reunion",
        subtitle: "Diwali, 1998",
        note: "Lights, laughter, and stories.",
        position: new THREE.Vector3(0.3, 0.9, -2.1),
        rotationY: 0.05,
      },
      {
        title: "Roots Journey",
        subtitle: "Heritage Tour, 2006",
        note: "Tracing the old hometown.",
        position: new THREE.Vector3(2.0, 0.9, -2.3),
        rotationY: -0.06,
      },
      {
        title: "Golden Anniversary",
        subtitle: "2014",
        note: "50 years together.",
        position: new THREE.Vector3(-2.3, 0.9, -4.1),
        rotationY: 0.02,
      },
      {
        title: "Legacy Portrait",
        subtitle: "2019",
        note: "A timeless memory.",
        position: new THREE.Vector3(1.6, 0.9, -4.0),
        rotationY: -0.03,
      },
    ];
    const boxGeo = new THREE.BoxGeometry(0.9, 1.4, 0.08);

    artifactData.forEach((item, index) => {
      const mat = new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0xb78e4c : 0xa67f3f,
      });
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.copy(item.position);
      mesh.rotation.y = item.rotationY;
      mesh.userData = item;
      scene.add(mesh);
      artifacts.push(mesh);
    });

    const portalGeo = new THREE.TorusGeometry(1.4, 0.08, 16, 64);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0xffe2a8,
      emissive: 0x5f4316,
      emissiveIntensity: 1.1,
      roughness: 0.35,
      metalness: 0.2,
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(0, 2.15, -3.3);
    scene.add(portal);

    const beaconGeo = new THREE.IcosahedronGeometry(0.38, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xfff1cb,
      emissive: 0xd4af37,
      emissiveIntensity: 1.5,
      roughness: 0.25,
      metalness: 0.55,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 1.25, 0);
    scene.add(beacon);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(artifacts);
      if (hits.length) {
        const picked = hits[0].object as THREE.Mesh;
        picked.scale.setScalar(1.08);
        setTimeout(() => picked.scale.setScalar(1), 250);
        const idx = artifacts.indexOf(picked);
        container?.dispatchEvent(
          new CustomEvent("museum-artifact-click", {
            detail: { index: idx, data: picked.userData },
          }),
        );
      }
    }

    const moveState = {
      left: false,
      right: false,
      forward: false,
    };
    const velocity = new THREE.Vector3(0, 0, 0);

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === "q") moveState.left = true;
      if (key === "d") moveState.right = true;
      if (key === "z") moveState.forward = true;
    }

    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "q") moveState.left = false;
      if (key === "d") moveState.right = false;
      if (key === "z") moveState.forward = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let rafId = 0;
    const startTime = performance.now();
    function animate() {
      const t = (performance.now() - startTime) / 1000;
      const accel = 0.003;
      const damping = 0.92;
      const maxSpeed = 0.06;
      const inputX = (moveState.right ? 1 : 0) - (moveState.left ? 1 : 0);
      const inputZ = moveState.forward ? -1 : 0;
      velocity.x = (velocity.x + inputX * accel) * damping;
      velocity.z = (velocity.z + inputZ * accel) * damping;
      velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.x));
      velocity.z = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.z));
      camera.position.x += velocity.x;
      camera.position.z += velocity.z;
      camera.position.x = Math.max(-8, Math.min(8, camera.position.x));
      camera.position.z = Math.max(-8, Math.min(6, camera.position.z));
      artifacts.forEach((a, i) => {
        a.rotation.y = Math.sin(t * 0.6 + i) * 0.03;
      });
      portal.rotation.z = t * 0.2;
      beacon.rotation.x = t * 0.7;
      beacon.rotation.y = t * 0.9;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      try {
        container.removeChild(renderer.domElement);
      } catch {}
      // Dispose geometry/materials
      boxGeo.dispose();
      artifacts.forEach((m) => {
        if (m.geometry) m.geometry.dispose();
        if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
        else m.material.dispose();
      });
      grid.geometry.dispose();
      if (Array.isArray(grid.material))
        grid.material.forEach((x) => x.dispose());
      else grid.material.dispose();
      portalGeo.dispose();
      portalMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      suppressHydrationWarning
    />
  );
}
