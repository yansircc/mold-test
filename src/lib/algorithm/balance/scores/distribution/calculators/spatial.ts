import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";

interface SpatialResult {
  uniformity: number;
  density: number;
  gridCells: number;
  occupiedCells: number;
}

export class SpatialCalculator {
  private gridSize = 20; // Default grid size

  constructor() {
    this.calculate = this.calculate.bind(this);
    this.calculateBounds = this.calculateBounds.bind(this);
    this.calculateGridMetrics = this.calculateGridMetrics.bind(this);
    this.toScoreDetails = this.toScoreDetails.bind(this);
  }

  calculate(
    layout: Record<number, Rectangle>,
    products: Product[],
  ): SpatialResult {
    // Handle empty or single product case
    if (products.length <= 1) {
      return {
        uniformity: 100,
        density: 100,
        gridCells: 1,
        occupiedCells: products.length,
      };
    }

    const bounds = this.calculateBounds(layout);
    if (!bounds) {
      return {
        uniformity: 0,
        density: 0,
        gridCells: 0,
        occupiedCells: 0,
      };
    }

    // Calculate grid metrics
    const { uniformity, density, gridCells, occupiedCells } =
      this.calculateGridMetrics(layout, bounds);

    return {
      uniformity: Math.min(100, uniformity * 120), // Add 20% bonus
      density: Math.min(100, density * 110), // Add 10% bonus
      gridCells,
      occupiedCells,
    };
  }

  toScoreDetails(analysis: SpatialResult) {
    return {
      uniformity: analysis.uniformity,
      density: analysis.density,
      coverage: (analysis.occupiedCells / analysis.gridCells) * 100,
    };
  }

  private calculateBounds(layout: Record<number, Rectangle>) {
    const rectangles = Object.values(layout);
    if (rectangles.length === 0) return null;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    rectangles.forEach((rect) => {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.length);
    });

    return { minX, minY, maxX, maxY };
  }

  private calculateGridMetrics(
    layout: Record<number, Rectangle>,
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
  ) {
    // Calculate grid cell size based on average product size
    const rectangles = Object.values(layout);
    const avgSize =
      rectangles.reduce(
        (sum, rect) => sum + Math.max(rect.width, rect.length),
        0,
      ) / rectangles.length;
    const cellSize = avgSize / 2; // Each cell is half the average product size

    // Create grid
    const gridWidth = Math.ceil((bounds.maxX - bounds.minX) / cellSize);
    const gridHeight = Math.ceil((bounds.maxY - bounds.minY) / cellSize);
    const grid: boolean[][] = Array.from({ length: gridHeight }, () =>
      Array.from({ length: gridWidth }, () => false),
    );

    // Mark occupied cells
    rectangles.forEach((rect) => {
      const startX = Math.floor((rect.x - bounds.minX) / cellSize);
      const startY = Math.floor((rect.y - bounds.minY) / cellSize);
      const endX = Math.ceil((rect.x + rect.width - bounds.minX) / cellSize);
      const endY = Math.ceil((rect.y + rect.length - bounds.minY) / cellSize);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
            grid[y]![x] = true;
          }
        }
      }
    });

    // Count occupied cells and calculate metrics
    let occupiedCells = 0;
    let neighborCount = 0;
    let totalNeighbors = 0;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y]![x]) {
          occupiedCells++;
          let neighbors = 0;
          // Check 8 neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = y + dy;
              const nx = x + dx;
              if (
                ny >= 0 &&
                ny < gridHeight &&
                nx >= 0 &&
                nx < gridWidth &&
                grid[ny]![nx]
              ) {
                neighbors++;
              }
            }
          }
          neighborCount += neighbors;
          totalNeighbors += 8; // Maximum possible neighbors
        }
      }
    }

    const gridCells = gridWidth * gridHeight;
    const density = occupiedCells / gridCells;
    const uniformity = neighborCount / totalNeighbors;

    return {
      uniformity: uniformity * 100,
      density: density * 100,
      gridCells,
      occupiedCells,
    };
  }
}
