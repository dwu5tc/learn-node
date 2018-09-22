import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';

// autocomplete( document.querySelector('#address'), document.querySelector('#lat'), ocument.querySelector('#lng'));
autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );



