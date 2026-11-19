document.addEventListener('DOMContentLoaded', function () {
  var tabBgp = document.getElementById('tabBgp');
  var tabEigrp = document.getElementById('tabEigrp');
  var panelBgp = document.getElementById('panelBgp');
  var panelEigrp = document.getElementById('panelEigrp');
  var glossaryBgp = document.getElementById('glossaryBgp');
  var glossaryEigrp = document.getElementById('glossaryEigrp');
  var glossarySearch = document.getElementById('glossarySearch');
  var glossaryNoResults = document.getElementById('glossaryNoResults');

  // --- 1. Whole-Word Search Across Both BGP & EIGRP Glossaries ---
  function filterGlossary() {
    if (!glossarySearch) return;
    var query = glossarySearch.value.trim();

    if (!query) {
      var isEigrp = tabEigrp.classList.contains('active');
      glossaryBgp.classList.toggle('hidden', isEigrp);
      glossaryEigrp.classList.toggle('hidden', !isEigrp);
      [glossaryBgp, glossaryEigrp].forEach(function (box) {
        box.querySelectorAll('.term-card, .glossary-cat').forEach(function (el) {
          el.classList.remove('hidden');
        });
      });
      if (glossaryNoResults) glossaryNoResults.classList.add('hidden');
      return;
    }

    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('\\b' + escaped, 'i');
    var visibleCount = 0;

    [glossaryBgp, glossaryEigrp].forEach(function (box) {
      var boxMatches = 0;
      box.querySelectorAll('.term-card').forEach(function (card) {
        var match = regex.test(card.textContent);
        card.classList.toggle('hidden', !match);
        if (match) { boxMatches++; visibleCount++; }
      });

      box.querySelectorAll('.glossary-cat').forEach(function (cat) {
        var next = cat.nextElementSibling;
        var hasVisible = false;
        while (next && !next.classList.contains('glossary-cat')) {
          if (next.classList.contains('term-card') && !next.classList.contains('hidden')) {
            hasVisible = true;
            break;
          }
          next = next.nextElementSibling;
        }
        cat.classList.toggle('hidden', !hasVisible);
      });

      box.classList.toggle('hidden', boxMatches === 0);
    });

    if (glossaryNoResults) {
      glossaryNoResults.classList.toggle('hidden', visibleCount > 0);
    }
  }

  function switchMode(mode) {
    tabBgp.classList.toggle('active', mode === 'bgp');
    tabEigrp.classList.toggle('active', mode === 'eigrp');
    panelBgp.classList.toggle('hidden', mode !== 'bgp');
    panelEigrp.classList.toggle('hidden', mode !== 'eigrp');
    filterGlossary();
  }

  tabBgp.addEventListener('click', function () { switchMode('bgp'); });
  tabEigrp.addEventListener('click', function () { switchMode('eigrp'); });
  if (glossarySearch) glossarySearch.addEventListener('input', filterGlossary);

  // --- 2. BGP Best-Path Selection Engine (WLLA OMNI) ---
  var bgpInputs = [
    'bgpWeightA', 'bgpLpA', 'bgpLocalA', 'bgpAsA', 'bgpOriginA', 'bgpMedA', 'bgpTypeA',
    'bgpWeightB', 'bgpLpB', 'bgpLocalB', 'bgpAsB', 'bgpOriginB', 'bgpMedB', 'bgpTypeB'
  ];

  function calculateBGP() {
    var a = {
      w: parseInt(document.getElementById('bgpWeightA').value, 10) || 0,
      lp: parseInt(document.getElementById('bgpLpA').value, 10) || 0,
      loc: parseInt(document.getElementById('bgpLocalA').value, 10),
      as: parseInt(document.getElementById('bgpAsA').value, 10) || 0,
      org: parseInt(document.getElementById('bgpOriginA').value, 10),
      med: parseInt(document.getElementById('bgpMedA').value, 10) || 0,
      type: parseInt(document.getElementById('bgpTypeA').value, 10)
    };
    var b = {
      w: parseInt(document.getElementById('bgpWeightB').value, 10) || 0,
      lp: parseInt(document.getElementById('bgpLpB').value, 10) || 0,
      loc: parseInt(document.getElementById('bgpLocalB').value, 10),
      as: parseInt(document.getElementById('bgpAsB').value, 10) || 0,
      org: parseInt(document.getElementById('bgpOriginB').value, 10),
      med: parseInt(document.getElementById('bgpMedB').value, 10) || 0,
      type: parseInt(document.getElementById('bgpTypeB').value, 10)
    };

    var winner = 'A';
    var reason = 'All 7 attributes are tied — tie broken by lowest BGP Router ID (Path A: 1.1.1.1 < Path B: 2.2.2.2).';

    if (a.w !== b.w) {
      winner = a.w > b.w ? 'A' : 'B';
      reason = 'Step 1 (Weight): Highest Weight wins (' + a.w + ' vs ' + b.w + ').';
    } else if (a.lp !== b.lp) {
      winner = a.lp > b.lp ? 'A' : 'B';
      reason = 'Step 2 (LOCAL_PREF): Highest Local Preference wins (' + a.lp + ' vs ' + b.lp + ').';
    } else if (a.loc !== b.loc) {
      winner = a.loc > b.loc ? 'A' : 'B';
      reason = 'Step 3 (Locally Originated): Self-originated route (0.0.0.0) beats peer-learned route.';
    } else if (a.as !== b.as) {
      winner = a.as < b.as ? 'A' : 'B';
      reason = 'Step 4 (AS_PATH): Shortest AS_PATH length wins (' + a.as + ' hops vs ' + b.as + ' hops).';
    } else if (a.org !== b.org) {
      winner = a.org < b.org ? 'A' : 'B';
      reason = 'Step 5 (Origin Code): Lowest Origin wins (IGP "i" < EGP "e" < Incomplete "?").';
    } else if (a.med !== b.med) {
      winner = a.med < b.med ? 'A' : 'B';
      reason = 'Step 6 (MED): Lowest Multi-Exit Discriminator wins (' + a.med + ' vs ' + b.med + ').';
    } else if (a.type !== b.type) {
      winner = a.type < b.type ? 'A' : 'B';
      reason = 'Step 7 (Neighbor Type): eBGP (AD 20) beats iBGP (AD 200).';
    }

    document.getElementById('bgpCardA').classList.toggle('is-winner', winner === 'A');
    document.getElementById('bgpCardB').classList.toggle('is-winner', winner === 'B');
    document.getElementById('bgpWinA').classList.toggle('hidden', winner !== 'A');
    document.getElementById('bgpWinB').classList.toggle('hidden', winner !== 'B');

    document.getElementById('bgpResultLog').innerHTML =
      '<strong>BGP Decision Result: Path ' + winner + ' Selected (*&gt;)</strong><br>' + reason;
  }

  bgpInputs.forEach(function (id) {
    document.getElementById(id).addEventListener('input', calculateBGP);
    document.getElementById(id).addEventListener('change', calculateBGP);
  });

  document.getElementById('resetBgpBtn').addEventListener('click', function () {
    document.getElementById('bgpWeightA').value = 0;
    document.getElementById('bgpLpA').value = 100;
    document.getElementById('bgpLocalA').value = '0';
    document.getElementById('bgpAsA').value = 2;
    document.getElementById('bgpOriginA').value = '1';
    document.getElementById('bgpMedA').value = 0;
    document.getElementById('bgpTypeA').value = '1';

    document.getElementById('bgpWeightB').value = 0;
    document.getElementById('bgpLpB').value = 100;
    document.getElementById('bgpLocalB').value = '0';
    document.getElementById('bgpAsB').value = 3;
    document.getElementById('bgpOriginB').value = '1';
    document.getElementById('bgpMedB').value = 0;
    document.getElementById('bgpTypeB').value = '1';
    calculateBGP();
  });
  // --- 3. EIGRP Classic Metric & Feasibility Condition (RD < FD) Engine ---
  var eigrpInputs = [
    'eigrpBw1', 'eigrpDly1', 'eigrpNbBw1', 'eigrpNbDly1',
    'eigrpBw2', 'eigrpDly2', 'eigrpNbBw2', 'eigrpNbDly2'
  ];

  function calcEigrpMetric(minBwKbps, totalDelayUs) {
    var bwTerm = Math.floor(10000000 / minBwKbps);
    var dlyTerm = Math.floor(totalDelayUs / 10);
    return 256 * (bwTerm + dlyTerm);
  }

  function calculateEIGRP() {
    var bw1 = parseInt(document.getElementById('eigrpBw1').value, 10);
    var dly1 = parseInt(document.getElementById('eigrpDly1').value, 10) || 10;
    var nbBw1 = parseInt(document.getElementById('eigrpNbBw1').value, 10);
    var nbDly1 = parseInt(document.getElementById('eigrpNbDly1').value, 10) || 10;

    var bw2 = parseInt(document.getElementById('eigrpBw2').value, 10);
    var dly2 = parseInt(document.getElementById('eigrpDly2').value, 10) || 10;
    var nbBw2 = parseInt(document.getElementById('eigrpNbBw2').value, 10);
    var nbDly2 = parseInt(document.getElementById('eigrpNbDly2').value, 10) || 10;

    // Reported Distance (Neighbor's own metric to destination)
    var rd1 = calcEigrpMetric(nbBw1, nbDly1);
    var rd2 = calcEigrpMetric(nbBw2, nbDly2);

    // Feasible Distance (Local router's end-to-end metric using bottleneck BW + cumulative Delay)
    var fd1 = calcEigrpMetric(Math.min(bw1, nbBw1), dly1 + nbDly1);
    var fd2 = calcEigrpMetric(Math.min(bw2, nbBw2), dly2 + nbDly2);

    var succ = fd1 <= fd2 ? 1 : 2;
    var bestFD = succ === 1 ? fd1 : fd2;
    var backupRD = succ === 1 ? rd2 : rd1;
    var isFS = backupRD < bestFD;

    var card1 = document.getElementById('eigrpCard1');
    var card2 = document.getElementById('eigrpCard2');
    var role1 = document.getElementById('eigrpRole1');
    var role2 = document.getElementById('eigrpRole2');

    card1.classList.remove('is-winner', 'is-backup');
    card2.classList.remove('is-winner', 'is-backup');
    role1.className = 'win-badge';
    role2.className = 'win-badge';

    if (succ === 1) {
      card1.classList.add('is-winner');
      role1.textContent = 'SUCCESSOR (RIB)';
      if (isFS) {
        card2.classList.add('is-backup');
        role2.classList.add('badge-fs');
        role2.textContent = 'FEASIBLE SUCCESSOR';
      } else {
        role2.classList.add('badge-nonfs');
        role2.textContent = 'NOT A FEASIBLE SUCCESSOR';
      }
    } else {
      card2.classList.add('is-winner');
      role2.textContent = 'SUCCESSOR (RIB)';
      if (isFS) {
        card1.classList.add('is-backup');
        role1.classList.add('badge-fs');
        role1.textContent = 'FEASIBLE SUCCESSOR';
      } else {
        role1.classList.add('badge-nonfs');
        role1.textContent = 'NOT A FEASIBLE SUCCESSOR';
      }
    }

    document.getElementById('eigrpMet1').innerHTML =
      'Local FD: <code>' + fd1.toLocaleString() + '</code> &nbsp;|&nbsp; R1 RD: <code>' + rd1.toLocaleString() + '</code>';
    document.getElementById('eigrpMet2').innerHTML =
      'Local FD: <code>' + fd2.toLocaleString() + '</code> &nbsp;|&nbsp; R2 RD: <code>' + rd2.toLocaleString() + '</code>';

    var backupName = succ === 1 ? 'Path 2 (R2)' : 'Path 1 (R1)';
    var fsMsg = isFS
      ? '<strong>PASS (RD ' + backupRD.toLocaleString() + ' &lt; FD ' + bestFD.toLocaleString() + '):</strong> ' + backupName + ' is a loop-free <strong>Feasible Successor</strong> ready for instant DUAL failover.'
      : '<strong>FAIL (RD ' + backupRD.toLocaleString() + ' &ge; FD ' + bestFD.toLocaleString() + '):</strong> ' + backupName + ' fails the Feasibility Condition and is NOT stored as a Feasible Successor (DUAL must send Queries if Successor fails).';

    document.getElementById('eigrpResultLog').innerHTML =
      '<strong>DUAL Topology Verdict: Path ' + succ + ' is Successor (Lowest FD = ' + bestFD.toLocaleString() + ')</strong><br>' + fsMsg;
  }

  eigrpInputs.forEach(function (id) {
    document.getElementById(id).addEventListener('input', calculateEIGRP);
    document.getElementById(id).addEventListener('change', calculateEIGRP);
  });

  document.getElementById('resetEigrpBtn').addEventListener('click', function () {
    document.getElementById('eigrpBw1').value = '100000';
    document.getElementById('eigrpDly1').value = 100;
    document.getElementById('eigrpNbBw1').value = '100000';
    document.getElementById('eigrpNbDly1').value = 100;

    document.getElementById('eigrpBw2').value = '10000';
    document.getElementById('eigrpDly2').value = 1000;
    document.getElementById('eigrpNbBw2').value = '100000';
    document.getElementById('eigrpNbDly2').value = 100;
    calculateEIGRP();
  });

  // Close parent modal on Esc key when embedded in 4any1
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && window.parent !== window) {
      window.parent.postMessage('closeBgpEigrpModal', '*');
    }
  });

  calculateBGP();
  calculateEIGRP();
});
