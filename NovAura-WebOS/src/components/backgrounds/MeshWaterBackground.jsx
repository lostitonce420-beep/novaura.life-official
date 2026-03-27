/**
 * Mesh Water Background
 * 
 * An interactive mesh/netting style background that reacts like water
 * with a light trace that follows the mouse cursor.
 * 
 * Features:
 * - Grid-based mesh with physics simulation
 * - Mouse interaction creates ripples/waves
 * - Light trace/glow follows cursor
 * - Smooth damping for fluid motion
 * - Customizable colors and intensity
 */

import React, { useEffect, useRef, useCallback } from 'react';

export default function MeshWaterBackground({
  gridSize = 40,              // Distance between mesh points
  damping = 0.95,             // Wave damping (0-1)
  tension = 0.05,             // Spring tension
  lightRadius = 150,          // Mouse light radius
  lightIntensity = 0.8,       // Light brightness (0-1)
  baseColor = '#0a0a0f',      // Background color
  lineColor = '#00d9ff',      // Mesh line color
  glowColor = '#a855f7',      // Mouse glow color
  lineOpacity = 0.15,         // Base line opacity
  interactive = true,         // Enable mouse interaction
  waveSpeed = 0.5,            // Wave propagation speed
  showParticles = true,       // Floating light particles
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 });
  const pointsRef = useRef([]);
  const particlesRef = useRef([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Initialize grid points
  const initGrid = useCallback((width, height) => {
    const cols = Math.ceil(width / gridSize) + 1;
    const rows = Math.ceil(height / gridSize) + 1;
    const points = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        points.push({
          x: x * gridSize,
          y: y * gridSize,
          originX: x * gridSize,
          originY: y * gridSize,
          vx: 0,
          vy: 0,
          force: 0,
        });
      }
    }

    return { points, cols, rows };
  }, [gridSize]);

  // Initialize floating particles
  const initParticles = useCallback((width, height) => {
    const particles = [];
    const count = Math.floor((width * height) / 50000);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        currentAlpha: 0,
      });
    }

    return particles;
  }, []);

  // Physics update for mesh
  const updatePhysics = useCallback((points, cols, rows, width, height) => {
    const mouse = mouseRef.current;

    points.forEach((point) => {
      const dx = mouse.x - point.x;
      const dy = mouse.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Mouse interaction
      if (interactive && dist < lightRadius) {
        const force = (1 - dist / lightRadius) * lightIntensity;
        const angle = Math.atan2(dy, dx);
        
        point.vx -= Math.cos(angle) * force * 2 + mouse.vx * 0.1;
        point.vy -= Math.sin(angle) * force * 2 + mouse.vy * 0.1;
        point.force = force;
      } else {
        point.force *= damping;
      }

      // Spring force back to origin
      const springX = (point.originX - point.x) * tension;
      const springY = (point.originY - point.y) * tension;

      point.vx += springX;
      point.vy += springY;

      // Damping
      point.vx *= damping;
      point.vy *= damping;

      // Update position
      point.x += point.vx * waveSpeed;
      point.y += point.vy * waveSpeed;

      // Boundary constraints
      point.x = Math.max(0, Math.min(width, point.x));
      point.y = Math.max(0, Math.min(height, point.y));
    });

    // Wave propagation between neighbors
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const point = points[i];

        const neighbors = [];
        if (x > 0) neighbors.push(points[i - 1]);
        if (x < cols - 1) neighbors.push(points[i + 1]);
        if (y > 0) neighbors.push(points[i - cols]);
        if (y < rows - 1) neighbors.push(points[i + cols]);

        let avgVx = 0, avgVy = 0;
        neighbors.forEach(n => {
          avgVx += n.vx;
          avgVy += n.vy;
        });

        if (neighbors.length > 0) {
          avgVx /= neighbors.length;
          avgVy /= neighbors.length;
          
          point.vx += (avgVx - point.vx) * 0.1;
          point.vy += (avgVy - point.vy) * 0.1;
        }
      }
    }
  }, [interactive, lightRadius, lightIntensity, damping, tension, waveSpeed]);

  // Update particles
  const updateParticles = useCallback((particles, width, height, time) => {
    const mouse = mouseRef.current;

    particles.forEach(p => {
      p.x += p.vx + Math.sin(time * 0.001 + p.phase) * 0.2;
      p.y += p.vy + Math.cos(time * 0.001 + p.phase) * 0.2;

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < lightRadius * 1.5) {
        const force = (1 - dist / (lightRadius * 1.5)) * 0.02;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      p.currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(time * 0.002 + p.phase));
    });
  }, [lightRadius]);

  // Draw frame
  const draw = useCallback((ctx, points, cols, rows, particles, time) => {
    const width = dimensionsRef.current.width;
    const height = dimensionsRef.current.height;
    const mouse = mouseRef.current;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;

    // Draw horizontal lines
    for (let y = 0; y < rows; y++) {
      ctx.beginPath();
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const point = points[i];

        if (x === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }

        const dx = mouse.x - point.x;
        const dy = mouse.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximityAlpha = Math.max(0, 1 - dist / lightRadius);
        const waveAlpha = Math.min(1, point.force * 2);
        
        const alpha = Math.min(1, lineOpacity + proximityAlpha * lightIntensity + waveAlpha * 0.3);
        
        if (x > 0) {
          ctx.strokeStyle = lineColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        }
      }
      ctx.stroke();
    }

    // Draw vertical lines
    for (let x = 0; x < cols; x++) {
      ctx.beginPath();
      for (let y = 0; y < rows; y++) {
        const i = y * cols + x;
        const point = points[i];

        if (y === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }

        const dx = mouse.x - point.x;
        const dy = mouse.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximityAlpha = Math.max(0, 1 - dist / lightRadius);
        const waveAlpha = Math.min(1, point.force * 2);
        
        const alpha = Math.min(1, lineOpacity + proximityAlpha * lightIntensity + waveAlpha * 0.3);
        
        if (y > 0) {
          ctx.strokeStyle = lineColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        }
      }
      ctx.stroke();
    }

    // Draw mouse glow
    if (interactive && mouse.x > 0) {
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, lightRadius
      );
      gradient.addColorStop(0, glowColor + '60');
      gradient.addColorStop(0.4, glowColor + '20');
      gradient.addColorStop(1, glowColor + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, lightRadius, 0, Math.PI * 2);
      ctx.fill();

      const coreGradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, lightRadius * 0.3
      );
      coreGradient.addColorStop(0, '#ffffff90');
      coreGradient.addColorStop(0.5, glowColor + '80');
      coreGradient.addColorStop(1, glowColor + '00');
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, lightRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw particles
    if (showParticles) {
      particles.forEach(p => {
        const distFromMouse = Math.sqrt(
          Math.pow(mouse.x - p.x, 2) + 
          Math.pow(mouse.y - p.y, 2)
        );
        
        const mouseGlow = Math.max(0, 1 - distFromMouse / lightRadius);
        const alpha = p.currentAlpha + mouseGlow * 0.5;
        
        ctx.fillStyle = mouseGlow > 0.1 ? glowColor : lineColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + mouseGlow), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    // Draw intersection points
    points.forEach(point => {
      const dx = mouse.x - point.x;
      const dy = mouse.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < lightRadius * 0.8) {
        const alpha = (1 - dist / (lightRadius * 0.8)) * lightIntensity;
        const size = 2 + alpha * 3;
        
        ctx.fillStyle = glowColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [baseColor, lineColor, glowColor, lineOpacity, interactive, lightRadius, lightIntensity, showParticles]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        dimensionsRef.current = { width: canvas.width, height: canvas.height };
        
        const { points, cols, rows } = initGrid(canvas.width, canvas.height);
        pointsRef.current = { points, cols, rows };
        particlesRef.current = initParticles(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mouseRef.current.vx = x - mouseRef.current.x;
      mouseRef.current.vy = y - mouseRef.current.y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.vx = 0;
      mouseRef.current.vy = 0;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = (time) => {
      const { points, cols, rows } = pointsRef.current;
      
      if (points) {
        updatePhysics(points, cols, rows, canvas.width, canvas.height);
        updateParticles(particlesRef.current, canvas.width, canvas.height, time);
        draw(ctx, points, cols, rows, particlesRef.current, time);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initGrid, initParticles, updatePhysics, updateParticles, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      style={{ 
        background: baseColor,
        touchAction: 'none',
      }}
    />
  );
}
