import * as assert from 'assert';

import * as Levenshtein from '../Levenshtein';

suite("Levenshtein Functions Tests", function () {
    test("Levenshtein Ratio - Same", function () {
        const ratio: Levenshtein.Levenshtein = Levenshtein.getLevenshteinRatioAndDistance('NAB AL Tools', 'NAB AL Tools', Levenshtein.LevenshteinCost.ratio);
        assert.equal(ratio.ratio, 1);
    });

    test("Levenshtein Distance - Same", function () {
        const distance: Levenshtein.Levenshtein = Levenshtein.getLevenshteinRatioAndDistance('NAB AL Tools', 'NAB AL Tools', Levenshtein.LevenshteinCost.distance);
        assert.equal(distance.distance, 0);
    });
    test("Levenshtein Ratio - Similar", function () {
        const ratio: Levenshtein.Levenshtein = Levenshtein.getLevenshteinRatioAndDistance('NAB AL Tools', 'nab-al-tools', Levenshtein.LevenshteinCost.ratio);
        assert.equal(ratio.ratio, 0.3333333333333333);
    });

    test("Levenshtein Distance - Similar", function () {
        const distance: Levenshtein.Levenshtein = Levenshtein.getLevenshteinRatioAndDistance('NAB AL Tools', 'nab-al-tools', Levenshtein.LevenshteinCost.distance);
        assert.equal(distance.distance, 8);
    });
    /**
     * Implementation Tests
     */
    test("MatchStringAgainstListOfStrings - Match All", function () {
        const targets = getListOfTargets();
        const result: Levenshtein.Levenshtein[] = Levenshtein.matchStringAgainstListOfStrings('NAB AL Tools', targets, 0);
        assert.equal(result.length, targets.length);
    });

    test("MatchStringAgainstListOfStrings - Default Threshold", function () {
        const targets = getListOfTargets();
        const result: Levenshtein.Levenshtein[] = Levenshtein.matchStringAgainstListOfStrings('NAB AL Tools', targets);
        assert.equal(result.length, 3);
        assert.equal(result[0].ratio, 1); //Same as source
        assert.equal(result[0].distance, 0); //Same as source
        assert.equal(result[2].target, targets[4]); //Partially unrelated
    });

    test("MatchStringAgainstListOfStrings - Narrow Threshold", function () {
        const targets = getListOfTargets();
        const result: Levenshtein.Levenshtein[] = Levenshtein.matchStringAgainstListOfStrings('NAB AL Tools', targets, 0.8);
        assert.equal(result.length, 2);
        assert.equal(result[0].ratio, 1); //Same as source
        assert.equal(result[0].distance, 0); //Same as source
        assert.equal(result[1].target, targets[3]); //Partially related
    });
});

function getListOfTargets(): string[] {
    return [
        'NAB AL Tools', // Same as source
        'nab-al-tools',  // Similar
        'no match!', // Far
        'NAB AL Xliff Tools', // Partial related
        'VS Code AL Tools' // Partial unrelated
    ];
}

