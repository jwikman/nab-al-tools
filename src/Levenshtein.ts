export interface Levenshtein {
    ratio?: number;
    distance?: number;
    source?: string;
    target?: string;
    threshold?: number;
}
export enum LevenshteinCost {
    Distance = 1,
    Ratio = 2
}

export function MatchStringAgainstListOfStrings(source: string, targets: string[], threshold: number = 0.6): Levenshtein[] {
    /**
     * @param threshold A threshold of 1.0 requires a perfect match (of both letters and location), a threshold of 0.0 would match anything.
     */
    let result: Levenshtein[] = [];
    for (const t of targets) {
        let match = GetLevenshteinRatioAndDistance(source, t, LevenshteinCost.Ratio);
        match.threshold = threshold;
        if (match.ratio !== undefined) {
            if ((match.ratio >= threshold)) {
                match.distance = GetLevenshteinRatioAndDistance(source, t, LevenshteinCost.Distance).distance;
                result.push(match);
            }
        }
    }

    return result;
}
export function GetLevenshteinRatioAndDistance(source: string, target: string, calcCost: LevenshteinCost): Levenshtein {
    let ratio: number = 0;
    let rows: number = source.length + 1;
    let cols: number = target.length + 1;
    let distance: number[][] = zeros([rows, cols]);

    for (let i = 0; i < rows; i++) {
        for (let k = 0; k < cols; k++) {
            distance[i][0] = i;
            distance[0][k] = k;
        }
    }

    let col: number = 0;
    let row: number = 0;
    for (col = 1; col < cols; col++) {
        for (row = 1; row < rows; row++) {
            let _cost: number;
            if (source[row - 1] === target[col - 1]) {
                _cost = 0;
            } else {
                _cost = calcCost;
            }
            distance[row][col] = Math.min(
                distance[row - 1][col] + 1, // Cost of deletions
                distance[row][col - 1] + 1, // Cost of insertions
                distance[row - 1][col - 1] + _cost //Cost of substitutions
            );
        }
    }
    if (calcCost === LevenshteinCost.Ratio) {
        ratio = ((source.length + target.length) - distance[source.length][target.length]) / (source.length + target.length);
        return { ratio: ratio, source: source, target: target };
    }

    return { distance: distance[source.length][target.length], source: source, target: target };

}

function zeros(shape: [number, number]): number[][] {
    let matrix = new Array(shape[0]);
    for (let i = 0; i < shape[0]; i++) {
        matrix[i] = new Array(shape[1]).fill(0);
    }
    return matrix;
}