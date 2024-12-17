import type { Point2D } from "@/types/core/geometry";

/**
 * Calculate inertia tensor for a rectangular element
 * @param x Center x coordinate
 * @param y Center y coordinate
 * @param width Rectangle width
 * @param height Rectangle height
 * @param mass Mass of the rectangle
 * @returns [Ixx, Iyy, Ixy] Inertia tensor components
 */
export function calculateRectangleInertia(
  x: number,
  y: number,
  width: number,
  height: number,
  mass: number,
): [number, number, number] {
  // Calculate moments of inertia using parallel axis theorem
  const Ixx = (mass * height ** 2) / 12 + mass * y ** 2;
  const Iyy = (mass * width ** 2) / 12 + mass * x ** 2;
  const Ixy = mass * x * y;

  return [Ixx, Iyy, Ixy];
}

/**
 * Calculate principal moments and axes from inertia tensor
 * @param Ixx Moment of inertia about x-axis
 * @param Iyy Moment of inertia about y-axis
 * @param Ixy Product of inertia
 * @returns Principal moments and corresponding axes
 */
export function calculatePrincipalComponents(
  Ixx: number,
  Iyy: number,
  Ixy: number,
): {
  moments: [number, number];
  axes: [[number, number], [number, number]];
} {
  // Calculate angle of principal axes
  const theta = 0.5 * Math.atan2(2 * Ixy, Ixx - Iyy);

  // Calculate principal moments
  const avgI = (Ixx + Iyy) / 2;
  const diffI = Math.sqrt(((Ixx - Iyy) / 2) ** 2 + Ixy ** 2);
  const I1 = avgI + diffI;
  const I2 = avgI - diffI;

  // Calculate principal axes
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  return {
    moments: [I1, I2],
    axes: [
      [cos, -sin], // First principal axis
      [sin, cos], // Second principal axis
    ],
  };
}

/**
 * Calculate gyration radius from principal moments
 * @param moments Principal moments [I1, I2]
 * @param totalMass Total mass of the system
 * @returns Gyration radius
 */
export function calculateGyrationRadius(
  moments: [number, number],
  totalMass: number,
): number {
  // Gyration radius is sqrt(trace(I)/mass)
  return Math.sqrt((moments[0] + moments[1]) / totalMass);
}

/**
 * Calculate center of mass for a system of rectangles
 * @param elements Array of rectangles with their masses
 * @returns Center of mass coordinates
 */
export function calculateCenterOfMass(
  elements: Array<{
    x: number;
    y: number;
    mass: number;
  }>,
): Point2D {
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (const element of elements) {
    totalMass += element.mass;
    sumX += element.mass * element.x;
    sumY += element.mass * element.y;
  }

  return {
    x: sumX / totalMass,
    y: sumY / totalMass,
  };
}

/**
 * Calculate mass distribution relative to center of mass
 * @param elements Array of rectangles with their masses
 * @param centerOfMass System center of mass
 * @returns Array of relative distances from center of mass
 */
export function calculateMassDistribution(
  elements: Array<{
    x: number;
    y: number;
    mass: number;
  }>,
  centerOfMass: Point2D,
): number[] {
  return elements.map((element) => {
    const dx = element.x - centerOfMass.x;
    const dy = element.y - centerOfMass.y;
    return Math.sqrt(dx * dx + dy * dy);
  });
}
