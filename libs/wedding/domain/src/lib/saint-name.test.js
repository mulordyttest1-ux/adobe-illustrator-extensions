import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CatholicSaintNames } from './saint-name.js';

describe('CatholicSaintNames', () => {
    it('recognizes the configured male and female saint-name seed list without rewriting the customer text', () => {
        const samples = [
            ['alphongso', 'Alphongs\u00f4'],
            ['aloisio', 'Aloisi\u00f4'],
            ['anre', 'Anr\u00ea'],
            ['anton', 'Ant\u00f4n'],
            ['augustino', 'Augustin\u00f4'],
            ['basilio', 'Basilio'],
            ['ba to lo me o', 'Ba-t\u00f4-l\u00f4-m\u00ea-\u00f4'],
            ['bernardo', 'B\u00eana\u0111\u00f4'],
            ['benedicto', 'Benedict\u00f4'],
            ['carlo acutis', 'Carlo Acutis'],
            ['claret', 'Claret'],
            ['daminh savio', '\u0110a-Minh Savi\u00f4'],
            ['\u00d0a-Minh', '\u0110a-Minh'],
            ['emmanuel', 'Emmanuel'],
            ['giacobe', 'Giac\u00f4b\u00ea'],
            ['gierado', 'Gi\u00eara\u0111\u00f4'],
            ['gioakim', 'Gioakim'],
            ['gioan bosco', 'Gioan Bosco'],
            ['gioan bao tixita', 'Gioan Baotixita'],
            ['gioan', 'Gioan'],
            ['gioan phaolo', 'Gioan Phaol\u00f4'],
            ['giuse', 'Giuse'],
            ['gregorio', 'Gregorio'],
            ['henrico', 'Henric\u00f4'],
            ['inhaxio', 'Inhaxi\u00f4'],
            ['lorenso', 'L\u00f4rens\u00f4'],
            ['luca', 'Luca'],
            ['mattheu', 'Matth\u00eau'],
            ['martino', 'Martin\u00f4'],
            ['micae', 'Micae'],
            ['maximiliano kolbe', 'Maximilian\u00f4 Kolbe'],
            ['nicola', 'Nic\u00f4la'],
            ['phanxico xavie', 'Phanxic\u00f4 Xavi\u00ea'],
            ['phanxico', 'Phanxic\u00f4'],
            ['phaolo', 'Phaol\u00f4'],
            ['phero', 'Ph\u00ear\u00f4'],
            ['philipphe', 'Philipph\u00ea'],
            ['pio', 'Pi\u00f4'],
            ['simon', 'Simon'],
            ['tephano', 'St\u00eaphan\u00f4'],
            ['toma', 'T\u00f4ma'],
            ['vincente', 'Vincent\u00ea'],
            ['vinh son', 'Vinh S\u01a1n'],
            ['agata', 'Agata'],
            ['anatasia', 'Anatasia'],
            ['ane', 'An\u00ea'],
            ['anna', 'Anna'],
            ['catarina', 'Catarina'],
            ['catherine', 'Catherine'],
            ['cecilia', 'Cecilia'],
            ['clara', 'Clara'],
            ['faustina', 'Faustina'],
            ['gianna', 'Gianna'],
            ['helena', 'Helena'],
            ['ine', 'In\u00ea'],
            ['isave', 'Isave'],
            ['katarina', 'Katarina'],
            ['marta', 'M\u00e1cta'],
            ['matta', 'M\u00e1cta'],
            ['maria madalena', 'Maria Madalena'],
            ['maria goretti', 'Maria Goretti'],
            ['maria', 'Maria'],
            ['mary', 'Mary'],
            ['lucia', 'Lucia'],
            ['monica', 'Monica'],
            ['rosa', 'Rosa']
        ];

        samples.forEach(([rawSaint, canonical]) => {
            const result = CatholicSaintNames.normalizeFullName(`${rawSaint} Nguy\u1ec5n V\u0103n An`);
            assert.equal(result.value, `${rawSaint} Nguy\u1ec5n V\u0103n An`);
            assert.equal(result.ordinaryName, 'Nguy\u1ec5n V\u0103n An');
            assert.equal(result.saint.canonical, canonical);
            assert.equal(result.saint.raw, rawSaint);
        });
    });

    it('matches long saint prefixes even when customers split syllables with spaces', () => {
        const samples = [
            ['phan xi co xa vi e Nguy\u1ec5n V\u0103n An', 'Phanxic\u00f4 Xavi\u00ea'],
            ['Phan-xi-c\u00f4 Xa-vi-\u00ea Nguy\u1ec5n V\u0103n An', 'Phanxic\u00f4 Xavi\u00ea'],
            ['gioan baotixita Nguy\u1ec5n V\u0103n An', 'Gioan Baotixita'],
            ['alphongso Nguy\u1ec5n V\u0103n An', 'Alphongs\u00f4'],
            ['augustino Nguy\u1ec5n V\u0103n An', 'Augustin\u00f4'],
            ['catherine Nguy\u1ec5n V\u0103n An', 'Catherine'],
            ['maximiliano kolbe Nguy\u1ec5n V\u0103n An', 'Maximilian\u00f4 Kolbe']
        ];

        samples.forEach(([raw, expectedSaint]) => {
            const result = CatholicSaintNames.normalizeFullName(raw);
            const ordinaryName = raw.slice(raw.indexOf(' Nguy\u1ec5n') + 1);
            assert.equal(result.value, raw);
            assert.equal(result.ordinaryName, ordinaryName);
            assert.equal(result.saint.canonical, expectedSaint);
        });
    });

    it('detects Teresa variants without canonicalizing the customer-provided spelling', () => {
        const variants = [
            'te-re-xa Nguy\u1ec5n Th\u1ecb An',
            't\u00ear\u00eaxa Nguy\u1ec5n Th\u1ecb An',
            'terexa Nguy\u1ec5n Th\u1ecb An',
            'te-r\u00ea-sa nguy\u1ec5n th\u1ecb an'
        ];

        variants.forEach((value) => {
            const result = CatholicSaintNames.normalizeFullName(value);
            const saintRaw = value.slice(0, value.indexOf(' '));
            assert.equal(result.value, value);
            assert.equal(result.ordinaryName, value.slice(value.indexOf(' ') + 1));
            assert.equal(result.saint.canonical, 'T\u00ea-R\u00ea-Xa');
            assert.equal(result.saint.raw, saintRaw);
            assert.equal(result.saint.start, 0);
            assert.equal(result.saint.end, saintRaw.length);
        });
    });

    it('does not classify ordinary Vietnamese names as saint names', () => {
        const result = CatholicSaintNames.normalizeFullName('Nguy\u1ec5n Th\u1ecb An');

        assert.equal(result.value, 'Nguy\u1ec5n Th\u1ecb An');
        assert.equal(result.saint, null);
        assert.deepEqual(CatholicSaintNames.getSuperscriptRanges(result.value), []);
    });

    it('returns a superscript range for only the customer-provided saint prefix', () => {
        assert.deepEqual(
            CatholicSaintNames.getSuperscriptRanges('terexa Nguy\u1ec5n Th\u1ecb An', 1),
            [{ start: 1, end: 7, baseline: 'superscript' }]
        );
    });
});
