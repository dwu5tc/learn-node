import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';

// autocomplete( document.querySelector('#address'), document.querySelector('#lat'), ocument.querySelector('#lng'));
autocomplete( $('#address'), $('#lat'), $('#lng') );

