import * as assert from 'assert';

import * as Levenshtein from '../Levenshtein';

suite("Levenshtein Functions Tests", function () {
    test("Levenshtein Ratio - Same", function () {
        let ratio: Levenshtein.Levenshtein = Levenshtein.GetLevenshteinRatioAndDistance('NAB AL Tools', 'NAB AL Tools', Levenshtein.LevenshteinCost.Ratio);
        assert.equal(ratio.ratio, 1);
    });

    test("Levenshtein Distance - Same", function () {
        let distance: Levenshtein.Levenshtein = Levenshtein.GetLevenshteinRatioAndDistance('NAB AL Tools', 'NAB AL Tools', Levenshtein.LevenshteinCost.Distance);
        assert.equal(distance.distance, 0);
    });
    test("Levenshtein Ratio - Similar", function () {
        let ratio: Levenshtein.Levenshtein = Levenshtein.GetLevenshteinRatioAndDistance('NAB AL Tools', 'nab-al-tools', Levenshtein.LevenshteinCost.Ratio);
        assert.equal(ratio.ratio, 0.3333333333333333);
    });

    test("Levenshtein Distance - Similar", function () {
        let distance: Levenshtein.Levenshtein = Levenshtein.GetLevenshteinRatioAndDistance('NAB AL Tools', 'nab-al-tools', Levenshtein.LevenshteinCost.Distance);
        assert.equal(distance.distance, 8);
    });
    /**
     * Implementation Tests
     */
    test("MatchStringAgainstListOfStrings - Match All", function () {
        let targets = GetListOfTargets();
        let result: Levenshtein.Levenshtein[] = Levenshtein.MatchStringAgainstListOfStrings('NAB AL Tools', targets, 0);
        assert.equal(result.length, targets.length);
    });

    test("MatchStringAgainstListOfStrings - Default Threshold", function () {
        let targets = GetListOfTargets();
        let result: Levenshtein.Levenshtein[] = Levenshtein.MatchStringAgainstListOfStrings('NAB AL Tools', targets);
        assert.equal(result.length, 3);
        assert.equal(result[0].ratio, 1); //Same as source
        assert.equal(result[0].distance, 0); //Same as source
        assert.equal(result[2].target, targets[4]); //Partially unrelated
    });

    test("MatchStringAgainstListOfStrings - Narrow Threshold", function () {
        let targets = GetListOfTargets();
        let result: Levenshtein.Levenshtein[] = Levenshtein.MatchStringAgainstListOfStrings('NAB AL Tools', targets, 0.8);
        assert.equal(result.length, 2);
        assert.equal(result[0].ratio, 1); //Same as source
        assert.equal(result[0].distance, 0); //Same as source
        assert.equal(result[1].target, targets[3]); //Partially related
    });
});

function GetListOfTargets() {
    return [
        'NAB AL Tools', // Same as source
        'nab-al-tools',  // Similar
        'no match!', // Far
        'NAB AL Xliff Tools', // Partial related
        'VS Code AL Tools' // Partial unrelated
    ];
}

