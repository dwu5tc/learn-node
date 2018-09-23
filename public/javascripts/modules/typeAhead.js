import axios from 'axios'; // what kind of syntax is this???
import dompurify from 'dompurify'; // should also do pre-save sanitization before storing to db

function searchResultsHTML(stores) {
  return stores.map(store => {
    return `
      <a href="/store/${ store.slug }" class="search__result">
        <strong>${ store.name }</strong>
      </a>
    `;
  }).join('');
}

function typeAhead(search) {
  if (!search) {
    return;
  }

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }

    // show the search results
    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${ this.value }`)
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${ this.value }!</div>`);
      })
      .catch(console.error); 
  });

  const activeClass = 'search__result--active';

  // should only attach this listener when there are results???
  searchInput.on('keyup', (e) => {
    const items = searchResults.querySelectorAll(`.search__result`);
    if (![13, 38, 40].includes(e.keyCode) || !items.length) {
      return;
    }

    let curr = searchResults.querySelector(`.${ activeClass }`);
  
    if (curr) {
      curr.classList.remove(activeClass);
    }
    
    if (e.keyCode === 40 && curr) {
      curr = curr.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      curr = items[0];
    } else if (e.keyCode === 38 && curr) {
      curr = curr.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      curr = items[items.length - 1];
    } else if (e.keyCode === 13 && curr.href) {
      window.location = curr.href;
      return;
    }
    curr.classList.add(activeClass);
  });
}

export default typeAhead;