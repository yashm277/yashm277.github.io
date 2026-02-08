(function () {
  'use strict';

  // --- Listing page (search / filter / sort) ---
  var grid = document.getElementById('project-grid');
  if (grid) {
    var cards = Array.from(grid.querySelectorAll('.project-card'));
    var searchInput = document.getElementById('project-search');
    var filterButtons = document.querySelectorAll('.filter-btn');
    var sortSelect = document.getElementById('project-sort-select');
    var noResults = document.getElementById('no-results');

    var currentFilter = 'all';
    var currentSearch = '';

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentSearch = this.value.toLowerCase().trim();
        applyFilters();
      });
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        applyFilters();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        sortCards(this.value);
      });
    }

    function applyFilters() {
      var visibleCount = 0;
      cards.forEach(function (card) {
        var matchesFilter = currentFilter === 'all' ||
          card.getAttribute('data-status') === currentFilter;

        var matchesSearch = true;
        if (currentSearch) {
          var title = card.getAttribute('data-title') || '';
          var desc = card.getAttribute('data-description') || '';
          var tags = card.getAttribute('data-tags') || '';
          var searchable = title + ' ' + desc + ' ' + tags;
          matchesSearch = searchable.indexOf(currentSearch) !== -1;
        }

        if (matchesFilter && matchesSearch) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (noResults) {
        noResults.style.display = visibleCount === 0 ? '' : 'none';
      }
    }

    function sortCards(criterion) {
      var sorted = cards.slice().sort(function (a, b) {
        switch (criterion) {
          case 'ranking':
            return (parseInt(a.dataset.ranking) || 999) -
                   (parseInt(b.dataset.ranking) || 999);
          case 'last-updated':
            return (b.dataset.lastUpdated || '0').localeCompare(
                    a.dataset.lastUpdated || '0');
          case 'stars':
            return (parseInt(b.dataset.stars) || 0) -
                   (parseInt(a.dataset.stars) || 0);
          case 'title':
            return (a.dataset.title || '').localeCompare(
                    b.dataset.title || '');
          default:
            return 0;
        }
      });
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    }

    // Update star counts on listing cards for sorting
    cards.forEach(function (card) {
      var repoUrl = card.getAttribute('data-github');
      if (!repoUrl) return;
      var match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
      if (!match) return;
      fetch('https://api.github.com/repos/' + match[1])
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.stargazers_count !== undefined) {
            card.setAttribute('data-stars', data.stargazers_count);
          }
        })
        .catch(function () {});
    });
  }

  // --- Detail page: GitHub repo card ---
  var repoCards = document.querySelectorAll('.github-repo-card[data-repo]');
  repoCards.forEach(function (card) {
    var repoUrl = card.getAttribute('data-repo');
    if (!repoUrl) return;
    var match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) return;
    var repoPath = match[1].replace(/\/$/, '');

    fetch('https://api.github.com/repos/' + repoPath)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.message) return; // API error

        var nameEl = card.querySelector('.github-repo-name');
        if (nameEl) {
          nameEl.textContent = data.full_name || repoPath;
        }

        var descEl = card.querySelector('.github-repo-desc');
        if (descEl) {
          descEl.textContent = data.description || 'No description provided.';
        }

        var starsEl = card.querySelector('.gh-stars');
        if (starsEl) {
          starsEl.textContent = data.stargazers_count;
        }

        var updatedEl = card.querySelector('.gh-updated');
        if (updatedEl && data.pushed_at) {
          var d = new Date(data.pushed_at);
          updatedEl.textContent = d.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
        }

        var langEl = card.querySelector('.gh-lang');
        if (langEl && data.language) {
          langEl.innerHTML = '&#128196; ' + data.language;
        }
      })
      .catch(function () {});
  });
})();
