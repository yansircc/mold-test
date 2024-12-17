/**
 * Generic type for validation function
 * T: type of items being grouped
 * G: type of validation result
 */
export type ValidationFunction<T, G> = (groups: T[][]) => {
  valid: boolean;
  result?: G;
};

/**
 * Options for generating combinations
 */
export interface CombinationOptions<T, G> {
  items: T[];                           // Items to be grouped
  validate?: ValidationFunction<T, G>;  // Optional validation function
  maxGroups?: number;                   // Maximum number of groups allowed
  minItemsPerGroup?: number;           // Minimum items per group
  maxItemsPerGroup?: number;           // Maximum items per group
}

/**
 * Generate all possible combinations of items into groups
 * @param options Configuration options for combination generation
 * @returns Array of valid combinations and their validation results
 */
export function generateAllPossibleCombinations<T, G>(
  options: CombinationOptions<T, G>
): Array<{ groups: T[][]; validationResult?: G }> {
  const {
    items,
    validate,
    maxGroups = items.length,
    minItemsPerGroup = 1,
    maxItemsPerGroup = items.length
  } = options;

  const results: Array<{ groups: T[][]; validationResult?: G }> = [];
  const seenCombinations = new Set<string>();

  function generateCombinations(
    remaining: T[],
    current: T[][],
    depth = 0
  ) {
    // Base case: all items have been assigned
    if (remaining.length === 0) {
      // Filter out empty groups and validate group sizes
      const nonEmptyGroups = current.filter(g => g.length > 0);
      if (nonEmptyGroups.some(g => 
        g.length < minItemsPerGroup || g.length > maxItemsPerGroup)) {
        return;
      }

      // Create a unique key for this combination
      const key = JSON.stringify(nonEmptyGroups.map(g => 
        g.map(item => items.indexOf(item)).sort()
      ).sort());

      // Skip if we've seen this combination before
      if (seenCombinations.has(key)) {
        return;
      }

      // Validate if validation function is provided
      if (validate) {
        const validationResult = validate(nonEmptyGroups);
        if (validationResult.valid) {
          seenCombinations.add(key);
          results.push({ 
            groups: nonEmptyGroups,
            validationResult: validationResult.result 
          });
        }
      } else {
        seenCombinations.add(key);
        results.push({ groups: nonEmptyGroups });
      }
      return;
    }

    // Get the next item to place
    const [currentItem, ...newRemaining] = remaining;

    // Ensure currentItem is defined
    if (!currentItem) {
      return;
    }

    // Try adding to existing groups
    current.forEach((group, i) => {
      if (group.length < maxItemsPerGroup) {
        const newGroups = current.map((g, idx) => 
          idx === i ? [...g, currentItem] : [...g]
        );
        generateCombinations(newRemaining, newGroups, depth + 1);
      }
    });

    // Try creating a new group if we haven't reached maxGroups
    if (current.length < maxGroups) {
      const newGroups = [...current, [currentItem]];
      generateCombinations(newRemaining, newGroups, depth + 1);
    }
  }

  generateCombinations(items, [[]]);
  return results;
}
